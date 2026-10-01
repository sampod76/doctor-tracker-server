import mongoose from "mongoose";
import { IGenericErrorResponse } from "../interfaces/common";
import { IGenericErrorMessage } from "../interfaces/error";

export const handleMongooseError = (
  error: mongoose.Error.ValidationError,
): IGenericErrorResponse => {
  const errors: IGenericErrorMessage[] = Object.values(error.errors).map(
    err => ({
      path: err.path,
      message: err.message,
    }),
  );

  return {
    statusCode: 400,
    message: "Validation failed",
    errorMessages: errors,
  };
};
