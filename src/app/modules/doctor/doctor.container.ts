import { userService } from "../user/user.container";
import { DoctorController } from "./doctor.controller";
import { DoctorRoutes } from "./doctor.route";
import { DoctorService } from "./doctor.service";
export const doctorService = new DoctorService(userService);
export const doctorController = new DoctorController(doctorService);
export const doctorRoutes = new DoctorRoutes(doctorController);
