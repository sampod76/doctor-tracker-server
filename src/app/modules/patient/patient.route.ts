import { AbstractRoute } from "../../core/abstract/AbstractRoute";
import { PatientController } from "./patient.controller";
import {
  createPatientZodSchema,
  getPatientZodSchema,
  listPatientsZodSchema,
  patientStatisticsZodSchema,
  updatePatientZodSchema,
} from "./patient.validation";
export class PatientRoutes extends AbstractRoute {
  constructor(private readonly controller: PatientController) {
    super();
    this.init();
  }
  protected init(): void {
    this.router
      .route("/")
      .post(
        this.authMiddleware(this.USER_ROLE.ADMIN, this.USER_ROLE.DOCTOR),
        this.validateRequestZod(createPatientZodSchema),
        this.controller.create,
      )
      .get(
        this.authMiddleware(this.USER_ROLE.ADMIN, this.USER_ROLE.DOCTOR),
        this.validateRequestZod(listPatientsZodSchema),
        this.controller.list,
      );
    this.router.get(
      "/statistics",
      this.authMiddleware(this.USER_ROLE.ADMIN, this.USER_ROLE.DOCTOR),
      this.validateRequestZod(patientStatisticsZodSchema),
      this.controller.statistics,
    );

    this.router
      .route("/:id")
      .get(
        this.authMiddleware(this.USER_ROLE.ADMIN, this.USER_ROLE.DOCTOR),
        this.validateRequestZod(getPatientZodSchema),
        this.controller.getById,
      )
      .patch(
        this.authMiddleware(this.USER_ROLE.ADMIN, this.USER_ROLE.DOCTOR),
        this.validateRequestZod(updatePatientZodSchema),
        this.controller.update,
      )
      .delete(
        this.authMiddleware(this.USER_ROLE.ADMIN, this.USER_ROLE.DOCTOR),
        this.validateRequestZod(getPatientZodSchema),
        this.controller.remove,
      );
  }
}
