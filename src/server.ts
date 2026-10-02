import "colors";
import http from "http";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "./app/config/database";
import { env } from "./app/config/env";
import {
  registerHttpServer,
  registerShutdownSteps,
  registerSignalHandlers,
  requestShutdown,
} from "./app/share/lifecycle";
import { logger } from "./app/share/logger";
import { Doctor } from "./app/modules/doctor/doctor.model";

let server: http.Server | undefined;

async function main(): Promise<void> {
  try {
    logger.info("[server:start] startup started");

    await connectDatabase();

    registerSignalHandlers();
    registerShutdownSteps([
      {
        kind: "database",
        name: "mongoose",
        close: () => disconnectDatabase(),
      },
    ]);

    server = http.createServer(app).listen(env.PORT, () => {
      logger.info(
        `HTTP Server running on port ${env.PORT}`.blue.underline.bold,
      );
    });

    registerHttpServer(server);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (env.NODE_ENV === "production") {
      logger.error(`Failed to start app: ${message}`);
    } else {
      console.log(`Failed to start app: ${message}`);
    }
    await requestShutdown("startup failure", 1);
  }
}

void main();
