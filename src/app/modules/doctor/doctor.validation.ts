import { z } from "zod";
import { objectId } from "../../../global/schema/global.schema";
import { createAccountZodSchema } from "../user/user.validation";
import { SPECIALIZATION } from "./doctor.constant";

const body = z
  .object({
    name: z.string().trim().min(2).max(100),
    specialization: z.nativeEnum(SPECIALIZATION),
    hospital: z.string().trim().min(2).max(200),
    phone: z.string().trim().min(6).max(20),
    isActive: z.boolean().optional(),
  })
  .strict();
export const createDoctorZodSchema = z.object({
  body: body.extend(createAccountZodSchema.omit({ role: true }).shape),
});
export const getDoctorZodSchema = z.object({
  params: z.object({ id: objectId }),
});
export const updateDoctorZodSchema = z.object({
  params: z.object({ id: objectId }),
  body: body
    .partial()
    .refine(
      value => Object.keys(value).length > 0,
      "Minium one field is required",
    ),
});
export const listDoctorsZodSchema = z.object({
  query: z
    .object({
      searchTerm: z.string().trim().max(100).optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      sortBy: z
        .enum(["createdAt", "updatedAt", "name", "specialization", "hospital"])
        .optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      specialization: z.nativeEnum(SPECIALIZATION).optional(),
      hospital: z.string().trim().max(200).optional(),
      isActive: z
        .enum(["true", "false"])
        .transform(value => value === "true")
        .optional(),
    })
    .strict(),
});

export type CreateDoctorDto = z.infer<typeof createDoctorZodSchema>["body"];
export type UpdateDoctorDto = z.infer<typeof updateDoctorZodSchema>["body"];
export type ListDoctorsQuery = z.infer<typeof listDoctorsZodSchema>["query"];
