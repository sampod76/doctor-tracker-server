import { Request, Response } from "express";
import httpStatus from "http-status";
import { AbstractController } from "../../core/abstract/AbstractController";
import { IUserRef } from "../../interfaces/user.ref";
import { AdminService } from "./admin.service";
import { ListAdminsQuery } from "./admin.validation";
export class AdminController extends AbstractController {
  constructor(private readonly service: AdminService) {
    super();
  }
  create = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.create(req.body, req.user as IUserRef);
    this.sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Admin created",
      data,
    });
  });
  list = this.catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAdminsQuery;
    const result = await this.service.findAll(query, req.user as IUserRef);
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      data: result.data,
      meta: result.meta,
    });
  });
  getById = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.findOne(
      req.params.id,
      req.user as IUserRef,
    );
    this.sendResponse(res, { statusCode: httpStatus.OK, data });
  });
  update = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.update(
      req.params.id,
      req.body,
      req.user as IUserRef,
    );
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Admin updated",
      data,
    });
  });
  remove = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.softDelete(
      req.params.id,
      req.user as IUserRef,
    );
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Admin deleted",
      data,
    });
  });
}
