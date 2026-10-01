import mongoose from "mongoose";
import { logger } from "../share/logger";
import { env } from "./env";

mongoose.connection.on("connected", () => {
  logger.info("[db] mongoose connected");
});

mongoose.connection.on("error", err => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`[db] mongoose error: ${message}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("[db] mongoose disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("[db] mongoose reconnected");
});

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: env.NODE_ENV !== "production",
  });

  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function getMongooseConnectionState(): number {
  return mongoose.connection.readyState;
}
