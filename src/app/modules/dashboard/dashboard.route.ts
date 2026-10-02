import { AbstractRoute } from "../../core/abstract/AbstractRoute";
import { DashboardController } from "./dashboard.controller";

export class DashboardRoutes extends AbstractRoute {
  constructor(private readonly controller: DashboardController) {
    super();
    this.init();
  }

  protected init(): void {
    this.router.get(
      "/overview",
      this.authMiddleware(this.USER_ROLE.ADMIN),
      this.controller.overview,
    );
  }
}
