import { z } from "zod";
import { ENUM_GENDER } from "../../../global/enums/users";
import { TREATMENT_STATUS } from "./patient.constant";
const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid ObjectId");
const date = z
  .string()
  .datetime({ offset: true })
  .transform(value => new Date(value));
const body = z
  .object({
    name: z.string().trim().min(2).max(100),
    phoneNumber: z.string().trim().min(6).max(20),
    doctorId: objectId,
    age: z.number().int().min(0).max(150),
    gender: z.nativeEnum(ENUM_GENDER),
    address: z.string().trim().max(500).optional(),
    patientComplaint: z.string().trim().min(1).max(5000),
    doctorAdvice: z.string().trim().max(5000).optional(),
    notes: z.string().trim().max(5000).optional(),
    treatmentStatus: z.nativeEnum(TREATMENT_STATUS).optional(),
    lastVisitAt: date.nullable().optional(),
    followUpDate: date.nullable().optional(),
  })
  .strict();
export const createPatientZodSchema = z.object({ body });
export const getPatientZodSchema = z.object({
  params: z.object({ id: objectId }),
});
export const updatePatientZodSchema = z.object({
  params: z.object({ id: objectId }),
  body: body
    .partial()
    .refine(
      value => Object.keys(value).length > 0,
      "At least one field is required",
    ),
});
export const listPatientsZodSchema = z.object({
  query: z
    .object({
      searchTerm: z.string().trim().max(100).optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      sortBy: z
        .enum([
          "createdAt",
          "updatedAt",
          "name",
          "followUpDate",
          "lastVisitAt",
          "age",
        ])
        .optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      doctorId: objectId.optional(),
      gender: z.nativeEnum(ENUM_GENDER).optional(),
      treatmentStatus: z.nativeEnum(TREATMENT_STATUS).optional(),
      followUpDate: date.optional(),
      lastVisitAt: date.optional(),
    })
    .strict(),
});
export const patientStatisticsZodSchema = z.object({
  query: z.object({ doctorId: objectId.optional() }).strict(),
});
export type CreatePatientDto = z.infer<typeof createPatientZodSchema>["body"];
export type UpdatePatientDto = z.infer<typeof updatePatientZodSchema>["body"];
export type ListPatientsQuery = z.infer<typeof listPatientsZodSchema>["query"];
