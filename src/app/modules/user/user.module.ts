import { UserController } from "./user.controller";

import { UserRoutes } from "./user.route";
import { UserService } from "./user.service";

export const userService = new UserService();
export const userController = new UserController(userService);
export const userRoutes = new UserRoutes(userController);