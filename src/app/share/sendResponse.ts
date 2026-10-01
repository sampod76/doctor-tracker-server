import { Request, Response } from "express";

type IApiResponse<T> = {
  statusCode?: number;
  success: boolean;
  message?: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data?: T | null; //এটা আমরা জানি না এটা একটা সিঙ্গেল অবজেক্ট হতে পারে একটা array  হতে পারে
};

const sendResponse = <T>(
  req: Request,
  res: Response,
  data: IApiResponse<T>,
): void => {
  const responseData: IApiResponse<T> = {
    statusCode: data.statusCode || 200,
    success: data.success,
    // message: data.message ? req.t(data.message) : null,
    message: data.message || null || undefined,
    meta: data.meta || null || undefined,
    data: data.data || null || undefined,
  };
  res.status(data.statusCode || 200).send(responseData);
};

export default sendResponse;
