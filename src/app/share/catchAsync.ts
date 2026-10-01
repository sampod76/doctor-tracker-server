import { NextFunction, Request, RequestHandler, Response } from "express";

const catchAsync = (fullFunctionBody: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fullFunctionBody(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
// const catchAsync = (fullFunctionBody: RequestHandler) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     Promise.resolve(fullFunctionBody(req, res, next)).catch(error =>
//       next(error),
//     );
//   };
// };

export default catchAsync;

export const tryCatchAsync = async <T>(
  fullFunctionBody: Promise<T>,
): Promise<{ result?: T; error?: any }> => {
  try {
    const result = await fullFunctionBody;
    return { result };
  } catch (error) {
    return { error };
  }
};

// const { result, error } = await tryCatchAsync(asyncFunction());
