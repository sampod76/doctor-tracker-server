import { DoctorController } from "./doctor.controller";
import { DoctorRoutes } from "./doctor.route";
import { DoctorService } from "./doctor.service";
import { userService } from "../user/user.module";
export const doctorService = new DoctorService(userService);
export const doctorController = new DoctorController(doctorService);
export const doctorRoutes = new DoctorRoutes(doctorController);
