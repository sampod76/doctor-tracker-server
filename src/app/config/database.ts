import mongoose from "mongoose";
import dns from "node:dns";
import { logger } from "../share/logger";
import { env } from "./env";

mongoose.connection.on("connected", () => {
  logger.info("database -> mongoose connected");
});

mongoose.connection.on("error", err => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`database -> mongoose error: ${message}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("database -> mongoose disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("database -> mongoose reconnected");
});

export async function connectDatabase(): Promise<typeof mongoose> {
  // Use custom DNS servers when provided, otherwise use reliable public DNS.
  const dnsServers = env.MONGODB_DNS_SERVERS
    ? env.MONGODB_DNS_SERVERS.map(server => server.trim()).filter(Boolean)
    : ["1.1.1.1", "8.8.8.8"];

  dns.setServers(dnsServers);

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
