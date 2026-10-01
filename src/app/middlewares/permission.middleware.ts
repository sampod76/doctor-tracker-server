import type { NextFunction, Request, Response } from "express";
import { PermissionCode } from "../../global/constant/permission";
import { ApiError } from "../errors/ApiError";

/**
 * requirePermission — coarse RBAC gate.
 *
 * The boilerplate keeps RBAC simple: the auth middleware has already
 * validated the token and loaded the user reference. Granular per-permission
 * checks are implemented inside services that load the user's
 * role→permission set.
 */
export const requirePermission = (
  _required: PermissionCode | PermissionCode[],
  _mode: "all" | "any" = "all",
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const reqUser = req.user;
      if (!reqUser?.userId) {
        throw new ApiError(401, "UNAUTHENTICATED");
      }

      // For non-admin users, additional per-permission enforcement happens
      // inside the service layer (look up assigned roles + permissions).
      // Here we simply allow the request through; tighten this once you wire
      // the per-permission loaders.
      next();
    } catch (error) {
      next(error);
    }
  };
};