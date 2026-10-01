import { AbstractRoute } from "../../core/abstract/AbstractRoute";
import { AuthenticationController } from "./authentication.controller";
import { AuthValidation } from "./authentication.validation";

export class AuthenticationRoutes extends AbstractRoute {
  constructor(private readonly controller: AuthenticationController) {
    super();
    this.init();
  }

  protected init(): void {
    this.router.post(
      "/login",
      this.validateRequestZod(AuthValidation.loginZodSchema),
      this.controller.login,
    );

    this.router.post(
      "/refresh-token",
      this.validateRequestZod(AuthValidation.refreshTokenZodSchema),
      this.controller.refresh,
    );

    this.router.get("/profile", this.authMiddleware(), this.controller.profile);

    this.router.post(
      "/change-password",
      this.authMiddleware(),
      this.validateRequestZod(AuthValidation.changePasswordZodSchema),
      this.controller.changePassword,
    );
  }
}
