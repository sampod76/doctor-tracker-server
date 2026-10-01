import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { USER_ROLE } from "../../global/enums/users";
import {
  type CachedAuthUser,
  authCache,
} from "../../helper/authCache";
import { accessTokenSecret, jwtHelpers } from "../../helper/jwtHelpers";
import { ApiError } from "../errors/ApiError";
import { User } from "../modules/user/user.model";

interface AuthTokenPayload {
  userId: string;
  role: USER_ROLE;
}

const UNAUTHORIZED_MESSAGE = "Unauthorized access";
const FORBIDDEN_MESSAGE = "Forbidden access";

const extractBearerToken = (
  authorizationHeader: string | undefined,
): string => {
  if (!authorizationHeader) {
    throw new ApiError(httpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
  }

  const parts = authorizationHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid authorization header");
  }
  return parts[1];
};

const authMiddleware =
  (...requiredUserTypes: USER_ROLE[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractBearerToken(req.headers.authorization);

      let payload: AuthTokenPayload;
      try {
        payload = jwtHelpers.verifyToken(
          token,
          accessTokenSecret,
        ) as AuthTokenPayload;
      } catch (error) {
        if (error instanceof Error && error.name === "TokenExpiredError") {
          throw new ApiError(httpStatus.UNAUTHORIZED, "Token expired");
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
      }

      if (!payload.userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Malformed token payload");
      }

      if (
        requiredUserTypes.length > 0 &&
        !requiredUserTypes.includes(payload.role)
      ) {
        throw new ApiError(httpStatus.FORBIDDEN, FORBIDDEN_MESSAGE);
      }

      // Prefer the cached auth-user payload to avoid hitting MongoDB on every
      // authenticated request. On a miss we fall back to the database and
      // then warm the cache for subsequent requests.
      let user: CachedAuthUser | null =
        authCache.getCachedAuthUser(payload.userId) ?? null;

      if (!user) {
        // Reject silently deleted or removed users.
        const dbUser = await User.findOne({
          _id: payload.userId,
          isDeleted: false,
        })
          .select("email role isActive")
          .lean()
          .exec();

        if (dbUser) {
          user = {
            _id: dbUser._id.toString(),
            email: dbUser.email,
            role: dbUser.role,
            isActive: dbUser.isActive,
          };
          authCache.setCachedAuthUser(user);
        }
      }

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User no longer exists");
      }

      if (
        requiredUserTypes.length > 0 &&
        !requiredUserTypes.includes(user.role)
      ) {
        throw new ApiError(httpStatus.FORBIDDEN, FORBIDDEN_MESSAGE);
      }

      if (user.isActive === false) {
        throw new ApiError(httpStatus.FORBIDDEN, "Account is inactive");
      }

      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

export default authMiddleware;
