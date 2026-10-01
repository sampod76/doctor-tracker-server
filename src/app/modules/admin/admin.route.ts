import { AbstractRoute } from "../../core/abstract/AbstractRoute";
import { AdminController } from "./admin.controller";
import {
  createAdminZodSchema,
  getAdminZodSchema,
  listAdminsZodSchema,
  updateAdminZodSchema,
} from "./admin.validation";
export class AdminRoutes extends AbstractRoute {
  constructor(private readonly controller: AdminController) {
    super();
    this.init();
  }
  protected init(): void {
    this.router
      .route("/")
      .post(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(createAdminZodSchema),
        this.controller.create,
      )
      .get(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(listAdminsZodSchema),
        this.controller.list,
      );

    this.router
      .route("/:id")
      .get(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(getAdminZodSchema),
        this.controller.getById,
      )
      .patch(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(updateAdminZodSchema),
        this.controller.update,
      )
      .delete(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(getAdminZodSchema),
        this.controller.remove,
      );
  }
}
