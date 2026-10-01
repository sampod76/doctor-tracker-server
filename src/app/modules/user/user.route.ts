import { AbstractRoute } from "../../core/abstract/AbstractRoute";
import { UserController } from "./user.controller";
import {
  getUserZodSchema,
  listUsersZodSchema,
  updateUserZodSchema,
} from "./user.validation";

export class UserRoutes extends AbstractRoute {
  constructor(private readonly controller: UserController) {
    super();
    this.init();
  }

  protected init(): void {
    this.router
      .route("/")
      .get(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(listUsersZodSchema),
        this.controller.findMany,
      );

    this.router
      .route("/:id")
      .get(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(getUserZodSchema),
        this.controller.getById,
      )
      .patch(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(updateUserZodSchema),
        this.controller.update,
      )
      .delete(
        this.authMiddleware(this.USER_ROLE.ADMIN),
        this.validateRequestZod(getUserZodSchema),
        this.controller.remove,
      );
  }
}
