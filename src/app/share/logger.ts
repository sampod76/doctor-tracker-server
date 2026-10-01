import path from "path";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "../config/env";

const { combine, timestamp, label, printf, errors } = format;

const myFormat = printf(({ level, message, label, timestamp, stack }) => {
  const date = new Date(timestamp as string | number | Date);
  return `${date.toISOString()} [${label}] ${level}: ${stack || message}`;
});

const baseFormat = combine(
  label({ label: env.NODE_ENV === "production" ? "naria-app" : "naria-dev" }),
  timestamp(),
  errors({ stack: true }),
  myFormat,
);

const logger = createLogger({
  level: env.LOG_LEVEL,
  format: baseFormat,
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join(
        process.cwd(),
        "logger",
        "winston",
        "successes",
        "naria-%DATE%-success.log",
      ),
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

const errorLogger = createLogger({
  level: "error",
  format: baseFormat,
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join(
        process.cwd(),
        "logger",
        "winston",
        "errors",
        "naria-%DATE%-error.log",
      ),
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

export { errorLogger, logger };