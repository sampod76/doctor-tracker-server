import express from "express";
import { adminRoutes } from "../modules/admin/admin.container";
import { authenticationRoutes } from "../modules/authentication/authentication.container";
import { dashboardRoutes } from "../modules/dashboard/dashboard.container";
import { doctorRoutes } from "../modules/doctor/doctor.container";
import { patientRoutes } from "../modules/patient/patient.container";
import { userRoutes } from "../modules/user/user.container";

const router = express.Router();

type ModuleRoute = {
  path: string;
  route: express.Router;
};

const moduleRoutes: ModuleRoute[] = [
  { path: "/dashboard", route: dashboardRoutes.router },
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
