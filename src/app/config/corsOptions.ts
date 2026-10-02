import type { CorsOptions } from "cors";
import { env } from "./env";

const normalizeOrigin = (origin: string): string =>
  origin.trim().replace(/\/+$/, "");

const allowedOrigins = new Set([
  ...env.CORS_ORIGIN.split(",").map(normalizeOrigin).filter(Boolean),

  // Custom origins
  "https://doctor-tracker.iblossomlearn.org",
  "https://doctor-tracker-pro.netlify.app",
  "https://doctor-tracker.iblossomlearn.com",
  "http://localhost:3000",
]);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (env.CORS_ORIGIN.trim() === "*") {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
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
    "x-time-zone",
  ],
};
