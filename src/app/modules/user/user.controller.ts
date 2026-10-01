import { Request, Response } from "express";
import httpStatus from "http-status";
import { PAGINATION_FIELDS } from "../../../global/constant/pagination";
import { AbstractController } from "../../core/abstract/AbstractController";
import { IUserRef } from "../../interfaces/user.ref";
import { userFilterableFields } from "./user.constant";
import { ListUsersQuery } from "./user.validation";
import { UserService } from "./user.service";

export class UserController extends AbstractController {
  constructor(private readonly service: UserService) {
    super();
  }

  findMany = this.catchAsync(async (req: Request, res: Response) => {
    const authuser = req.user as IUserRef;
    const filters = this.pick(req.query, userFilterableFields);
    const paginationOptions = this.pick(req.query, PAGINATION_FIELDS);
    const result = await this.service.findAll(
      filters as ListUsersQuery,
      paginationOptions,
      authuser,
    );
    return this.sendResponse(res, {
      statusCode: httpStatus.OK,
      data: result.data,
      meta: result.meta,
    });
  });

  getById = this.catchAsync(async (req: Request, res: Response) => {
    const user = await this.service.findOne(req.params.id);
    return this.sendResponse(res, {
      statusCode: httpStatus.OK,
      data: user,
    });
  });

  update = this.catchAsync(async (req: Request, res: Response) => {
    const user = await this.service.update(req.params.id, req.body);
    return this.sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "User updated",
      data: user,
    });
  });

  remove = this.catchAsync(async (req: Request, res: Response) => {
    await this.service.softDelete(req.params.id);
    return this.sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "User deleted",
    });
  });
}
