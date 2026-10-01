import { Request, Response } from "express";
import httpStatus from "http-status";
import { AbstractController } from "../../core/abstract/AbstractController";
import { IUserRef } from "../../interfaces/user.ref";
import { AuthenticationService } from "./authentication.service";

export class AuthenticationController extends AbstractController {
  constructor(private readonly service: AuthenticationService) {
    super();
  }

  login = this.catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.login(req.body);
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Login successful",
      data: result,
    });
  });

  refresh = this.catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.refresh(req.body.refreshToken);
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  profile = this.catchAsync(async (req: Request, res: Response) => {
    const authUser = req.user as IUserRef;
    const profile = await this.service.profile(authUser);
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      data: profile,
    });
  });

  changePassword = this.catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.changePassword(
      req.user!.userId,
      req.body,
    );
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}
