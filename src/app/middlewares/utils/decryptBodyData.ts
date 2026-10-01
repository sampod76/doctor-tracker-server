import { NextFunction, Request, Response } from "express";
import { env } from "../../../app/config/env";
import { decryptCryptoData } from "../../../utils/cryptoEncryptDecrypt";

const decryptMiddleware =
  () => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const decryptedData = decryptCryptoData(
        req.body?.data,
        env.ENCRYPTION_KEY ?? "",
      );
      req.body = decryptedData;
      next();
    } catch (error) {
      next(error);
    }
  };

export default decryptMiddleware;
