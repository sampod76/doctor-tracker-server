import { NextFunction, Request, RequestHandler, Response } from "express";
import { PAGINATION_FIELDS } from "../../../global/constant/pagination";

type IApiResponse<T> = {
  statusCode?: number;
  success?: boolean;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data?: T;
};

export abstract class AbstractController {
  protected readonly PAGINATION_FIELDS = PAGINATION_FIELDS;

  protected catchAsync =
    (fn: RequestHandler) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };

  protected sendResponse = <T>(res: Response, payload: IApiResponse<T>) => {
    res.status(payload.statusCode ?? 200).json({
      success: payload.success ?? true,
      statusCode: payload.statusCode ?? 200,
      message: payload.message ?? "",
      meta: payload.meta ?? undefined,
      data: payload.data ?? null,
    });
  };

  protected pick = <T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[],
  ): Partial<T> => {
    const finalObj: Partial<T> = {};

    for (const key of keys) {
      if (key in obj) {
        finalObj[key] = obj[key];
      }
    }

    return finalObj;
  };
}
