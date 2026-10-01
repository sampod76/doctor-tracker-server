import jwt, {
  JwtPayload,
  Secret,
  SignOptions,
  VerifyOptions,
} from "jsonwebtoken";
import { env } from "../app/config/env";

const createToken = (
  payload: object,
  secret: Secret,
  expireTime: SignOptions["expiresIn"],
): string => {
  const cleanPayload = {
    ...(payload as Record<string, unknown>),
  };

  delete cleanPayload.exp;
  delete cleanPayload.iat;
  delete cleanPayload.nbf;

  return jwt.sign(cleanPayload, secret, {
    expiresIn: expireTime,
  });
};

const createResetToken = (
  payload: object,
  secret: Secret,
  expireTime: string | number,
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: expireTime,
  } as SignOptions);
};

const verifyToken = (
  token: string,
  secret: Secret,
  options?: VerifyOptions,
): JwtPayload => {
  return jwt.verify(token, secret, options) as JwtPayload;
};

export const jwtHelpers = {
  createToken,
  verifyToken,
  createResetToken,
};

// Convenience accessors built on top of env.
export const accessTokenSecret = env.JWT_SECRET;
export const accessTokenExpiresIn = env.JWT_EXPIRES_IN;
export const refreshTokenSecret = env.JWT_REFRESH_SECRET;
export const refreshTokenExpiresIn = env.JWT_REFRESH_EXPIRES_IN;