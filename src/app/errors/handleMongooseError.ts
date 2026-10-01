import mongoose from "mongoose";
import { IGenericErrorMessage } from "../interface/error";
import { IGenericErrorResponse } from "../interface/common";

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
