import { Request, Response } from "express";
import httpStatus from "http-status";
import { AbstractController } from "../../core/abstract/AbstractController";
import { IUserRef } from "../../interfaces/user.ref";
import { DoctorService } from "./doctor.service";
import { ListDoctorsQuery } from "./doctor.validation";
export class DoctorController extends AbstractController {
  constructor(private readonly service: DoctorService) {
    super();
  }
  create = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.create(req.body, req.user as IUserRef);
    this.sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Doctor created",
      data,
    });
  });
  findAll = this.catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListDoctorsQuery;
    const result = await this.service.findAll(query, req.user as IUserRef);
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      data: result.data,
      meta: result.meta,
    });
  });
  getById = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.findOne(req.params.id);
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
      message: "Doctor updated",
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
      message: "Doctor deleted",
      data,
    });
  });

  statistics = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.statistics();
    this.sendResponse(res, { statusCode: httpStatus.OK, data });
  });
}
