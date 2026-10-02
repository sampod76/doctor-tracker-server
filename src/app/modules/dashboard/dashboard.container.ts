import { DashboardController } from "./dashboard.controller";
import { DashboardRoutes } from "./dashboard.route";
import { DashboardService } from "./dashboard.service";

export const dashboardService = new DashboardService();
export const dashboardController = new DashboardController(dashboardService);
export const dashboardRoutes = new DashboardRoutes(dashboardController);
