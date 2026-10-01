export class ApiError extends Error {
  statusCode: number;
  userMessage: string;
  developerMessage?: string;
  errorCode?: string;
  details?: unknown;

  constructor(
    statusCode: number,
    userMessage: string,
    developerMessage?: string,
    errorCode?: string,
    details?: unknown,
    stack = "",
  ) {
    // Internal Error.message
    super(developerMessage || userMessage);

    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.developerMessage = developerMessage;
    this.errorCode = errorCode;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
