import { Request, Response } from "express";
import httpStatus from "http-status";
import { AbstractController } from "../../core/abstract/AbstractController";
import { IUserRef } from "../../interfaces/user.ref";
import { PatientService } from "./patient.service";
import { ListPatientsQuery } from "./patient.validation";
export class PatientController extends AbstractController {
  constructor(private readonly service: PatientService) {
    super();
  }
  create = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.create(req.body, req.user as IUserRef);
    this.sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Patient created",
      data,
    });
  });
  list = this.catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListPatientsQuery;
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
      message: "Patient updated",
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
      message: "Patient deleted",
      data,
    });
  });
  restore = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.restore(
      req.params.id,
      req.user as IUserRef,
    );
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Patient restored",
      data,
    });
  });
  statistics = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.statistics(
      req.user as IUserRef,
      req.query.doctorId as string | undefined,
    );
    this.sendResponse(res, { statusCode: httpStatus.OK, data });
  });
}
