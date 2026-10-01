import { AbstractRoute } from "../../core/abstract/AbstractRoute";
import { DoctorController } from "./doctor.controller";
import {
  createDoctorZodSchema,
  getDoctorZodSchema,
  listDoctorsZodSchema,
  updateDoctorZodSchema,
} from "./doctor.validation";
export class DoctorRoutes extends AbstractRoute {
  constructor(private readonly controller: DoctorController) {
    super();
    this.init();
  }
  protected init(): void {
    this.router
      .route("/")
      .post(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(createDoctorZodSchema),
        this.controller.create,
      )
      .get(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(listDoctorsZodSchema),
        this.controller.findAll,
      );
    this.router.get(
      "/statistics",
      this.authMiddleware(this.USER_ROLE.ADMIN),
      this.controller.statistics,
    );

    this.router
      .route("/:id")
      .get(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(getDoctorZodSchema),
        this.controller.getById,
      )
      .patch(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(updateDoctorZodSchema),
        this.controller.update,
      )
      .delete(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(getDoctorZodSchema),
        this.controller.remove,
      );
  }
}
