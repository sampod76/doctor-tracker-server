import { PatientController } from "./patient.controller";
import { PatientRoutes } from "./patient.route";
import { PatientService } from "./patient.service";
export const patientService = new PatientService();
export const patientController = new PatientController(patientService);
export const patientRoutes = new PatientRoutes(patientController);
