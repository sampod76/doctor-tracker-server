// src/common/utils/verify-hmac-signature.ts
import crypto from "crypto";
import { env } from "../app/config/env";

type IVerifyHmacSignatureOptions = {
  secret?: string;
};

export const verifyHmacSignature = <T>(
  payload: T,
  timestamp: string,
  signature: string,
  requestId: string,
  options: IVerifyHmacSignatureOptions = {},
): boolean => {
  const secret = options.secret ?? env.JWT_REFRESH_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${requestId}.${timestamp}.${JSON.stringify(payload)}`)
    .digest("hex");

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
};