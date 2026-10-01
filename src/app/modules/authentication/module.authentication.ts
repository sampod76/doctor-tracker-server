import { AuthenticationController } from "./authentication.controller";
import { AuthenticationRoutes } from "./authentication.route";
import { AuthenticationService } from "./authentication.service";

export const authenticationService = new AuthenticationService();
export const authenticationController = new AuthenticationController(
  authenticationService,
);
export const authenticationRoutes = new AuthenticationRoutes(
  authenticationController,
);