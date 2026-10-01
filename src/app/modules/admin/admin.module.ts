import { AdminController } from "./admin.controller";
import { AdminRoutes } from "./admin.route";
import { AdminService } from "./admin.service";
import { userService } from "../user/user.module";
export const adminService = new AdminService(userService);
export const adminController = new AdminController(adminService);
export const adminRoutes = new AdminRoutes(adminController);
