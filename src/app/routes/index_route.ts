import express from "express";
import { userRoutes } from "../modules/user/user.module";
import { adminRoutes } from "../modules/admin/admin.module";
import { doctorRoutes } from "../modules/doctor/doctor.module";
import { patientRoutes } from "../modules/patient/patient.module";
import { authenticationRoutes } from "../modules/authentication/authentication.module";

const router = express.Router();

type ModuleRoute = {
  path: string;
  route: express.Router;
};

const moduleRoutes: ModuleRoute[] = [
  { path: "/admins", route: adminRoutes.router },
  { path: "/doctors", route: doctorRoutes.router },
  { path: "/patients", route: patientRoutes.router },
  {
    path: "/auth",
    route: authenticationRoutes.router,
  },
  {
    path: "/users",
    route: userRoutes.router,
  },
];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export default router;
