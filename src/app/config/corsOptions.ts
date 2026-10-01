import type { CorsOptions } from "cors";
import { env } from "./env";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (env.CORS_ORIGIN === "*") {
      return callback(null, true);
    }

    const allowed = env.CORS_ORIGIN.split(",")
      .map(o => o.trim())
      .filter(Boolean);

    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-client-key",
    "x-client-token",
    "x-client-secret",
    "x-device-id",
  ],
};
