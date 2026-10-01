import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { USER_ROLE } from "../../global/enums/users";
import { accessTokenSecret, jwtHelpers } from "../../helper/jwtHelpers";
import { ApiError } from "../errors/ApiError";
import { User } from "../modules/user/user.model";

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

      let payload: { userId: string; role: USER_ROLE };
      try {
        payload = jwtHelpers.verifyToken(token, accessTokenSecret) as never;
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

      // Reject silently deleted or removed users.
      const user = await User.findOne({
        _id: payload.userId,
        isDeleted: false,
      })
        .select("email role isActive")
        .lean()
        .exec();

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
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

export default authMiddleware;
