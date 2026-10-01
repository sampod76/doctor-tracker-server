import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./app/config/env";
import { corsOptions } from "./app/config/corsOptions";
import { helmetConfig } from "./app/config/helmetConfig";
import router from "./app/routes/index_route";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";

const app: Application = express();

app.set("trust proxy", env.NODE_ENV === "development" ? 0 : 1);
app.disable("x-powered-by");

app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      statusCode: httpStatus.TOO_MANY_REQUESTS,
      message: "Too many requests, please try again later.",
    },
  }),
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/v1", router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "Route not found",
    errorMessages: [{ path: req.originalUrl, message: "api not found" }],
  });
});

export default app;
