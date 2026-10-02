import { Request, Response } from "express";
import httpStatus from "http-status";
import { AbstractController } from "../../core/abstract/AbstractController";
import { DashboardService } from "./dashboard.service";

export class DashboardController extends AbstractController {
  constructor(private readonly service: DashboardService) {
    super();
  }

  overview = this.catchAsync(async (req: Request, res: Response) => {
    const data = await this.service.getOverview(req.query.followUpDate);
    this.sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Dashboard overview retrieved successfully",
      data,
    });
  });
}
