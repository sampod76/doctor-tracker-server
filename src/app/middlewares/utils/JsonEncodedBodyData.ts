import { NextFunction, Request, Response } from "express";

const JsonEncodedBodyData =
  (encodeName?: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = JSON.parse(req.body[encodeName || "jsonEncoded"]);
      // console.log("req---body-1 ---.",req.body)
      next();
    } catch (error) {
      next(error);
    }
  };

export default JsonEncodedBodyData;
