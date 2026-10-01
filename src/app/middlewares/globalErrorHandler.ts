import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiError } from "../errors/ApiError";
import { handleMongooseError } from "../errors/handleMongooseError";
import handleZodError from "../errors/handleZodError";
import ServiceError from "../errors/ServiceError";
import { IGenericErrorMessage } from "../interfaces/error";
import { errorLogger } from "../share/logger";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errorMessage: IGenericErrorMessage[] = [];
  let errorCode: string | undefined;

  // Zod validation error
  if (error instanceof ZodError) {
    const simplified = handleZodError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessage = simplified.errorMessages;
  }

  // Mongoose validation error
  else if (error instanceof mongoose.Error.ValidationError) {
    const simplified = handleMongooseError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessage = simplified.errorMessages;
  }

  // Mongoose cast error (bad ObjectId, etc.)
  else if (error instanceof mongoose.Error.CastError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = `Invalid ${error.path}: ${error.value}`;
    errorMessage = [{ path: error.path, message: error.message }];
  }

  // Mongo duplicate key (E11000)
  else if (
    (error as { code?: number; name?: string })?.code === 11000 ||
    (error as { code?: number; name?: string })?.name === "MongoServerError"
  ) {
    statusCode = httpStatus.CONFLICT;
    const fieldMatch = (error as { keyValue?: Record<string, unknown> })
      ?.keyValue;
    const field = fieldMatch ? Object.keys(fieldMatch)[0] : "field";
    message = `Duplicate ${field} value`;
    errorMessage = [{ path: field, message: `Duplicate ${field} value` }];
  }

  // JWT errors
  else if (error?.name === "JsonWebTokenError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Unauthorized access";
    errorCode = "INVALID_TOKEN";
  } else if (error?.name === "TokenExpiredError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Your session has expired. Please log in again.";
    errorCode = "TOKEN_EXPIRED";
  }

  // Domain ApiError
  else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.userMessage;
    errorCode = error.errorCode;
    errorMessage = [{ path: "", message: error.userMessage }];
  }

  // Custom ServiceError
  else if (error instanceof ServiceError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessage = error.errorMessage || [];
  }

  // Unknown / native Error
  else if (error instanceof Error) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      env.NODE_ENV === "production"
        ? "Something went wrong. Please try again later."
        : error.message;
    errorCode = "INTERNAL_SERVER_ERROR";
    errorMessage =
      env.NODE_ENV === "production"
        ? []
        : [{ path: "", message: error.message }];
  }

  if (error instanceof ApiError) {
    errorLogger.error({
      type: "ApiError",
      statusCode: error.statusCode,
      userMessage: error.userMessage,
      developerMessage: error.developerMessage || error.message,
      errorCode: error.errorCode,
      details: error.details,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
    });
  } else {
    errorLogger.error({
      type: error?.constructor?.name || "UnknownError",
      statusCode,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      stack: error instanceof Error ? error.stack : undefined,
      method: req.method,
      url: req.originalUrl,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(errorCode && { errorCode }),
    errorMessage,
    ...(env.NODE_ENV !== "production" && {
      stack: error instanceof Error ? error.stack : undefined,
      ...(error instanceof ApiError && {
        developerMessage: error.developerMessage,
        details: error.details,
      }),
    }),
  });
};

export default globalErrorHandler;
