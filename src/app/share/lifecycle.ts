import http from "http";
import { logger } from "./logger";

type ResourceKind = "http" | "database";

export type ShutdownStep = {
  kind: ResourceKind;
  name: string;
  close: () => Promise<void> | void;
};

const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 10_000;

let shutdownPromise: Promise<number> | undefined;
let registeredSteps: ShutdownStep[] = [];
let processExitCode: number | undefined;
let httpServerRef: http.Server | undefined;

export function registerShutdownSteps(steps: ShutdownStep[]): void {
  registeredSteps = steps;
}

export function registerHttpServer(server: http.Server): void {
  httpServerRef = server;
}

export function registerSignalHandlers(): void {
  process.on("SIGINT", () => {
    void requestShutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void requestShutdown("SIGTERM");
  });

  process.on("uncaughtException", error => {
    logger.error(
      `[lifecycle] uncaughtException: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    void requestShutdown("uncaughtException", 1);
  });

  process.on("unhandledRejection", reason => {
    const message = reason instanceof Error ? reason.message : String(reason);
    logger.error(`[lifecycle] unhandledRejection: ${message}`);
    void requestShutdown("unhandledRejection", 1);
  });
}

export function requestShutdown(
  reason: string,
  exitCode: number = 0,
): Promise<number> {
  if (shutdownPromise) return shutdownPromise;

  shutdownPromise = (async () => {
    processExitCode = exitCode;
    logger.info(`[lifecycle] shutdown starting reason=${reason}`);

    const shutdownGuard = new Promise<void>(resolve => {
      const timer = setTimeout(() => {
        logger.error(
          `[lifecycle] shutdown timeout after ${GRACEFUL_SHUTDOWN_TIMEOUT_MS}ms; forcing exit`,
        );
        resolve();
      }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
      timer.unref?.();
    });

    const shutdownWork = (async () => {
      if (httpServerRef?.listening) {
        await new Promise<void>(resolve => {
          httpServerRef!.close(() => resolve());
        });
        logger.info("[lifecycle] HTTP server closed");
      }

      for (const step of registeredSteps.filter(s => s.kind !== "http")) {
        try {
          await step.close();
          logger.info(`[lifecycle] ${step.kind}/${step.name} closed`);
        } catch (error) {
          processExitCode = 1;
          logger.error(
            `[lifecycle] ${step.kind}/${step.name} close failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    })();

    await Promise.race([shutdownWork, shutdownGuard]);

    const finalCode = processExitCode ?? 0;
    process.exitCode = finalCode;
    logger.info(`[lifecycle] shutdown complete exitCode=${finalCode}`);
    return finalCode;
  })();

  return shutdownPromise;
}

/** Test-only — reset the lifecycle coordinator between tests. */
export function __resetForTests(): void {
  shutdownPromise = undefined;
  registeredSteps = [];
  processExitCode = undefined;
  httpServerRef = undefined;
}
