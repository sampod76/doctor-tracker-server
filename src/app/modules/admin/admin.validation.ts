import { z } from "zod";
import { createAccountZodSchema } from "../user/user.validation";
const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid ObjectId");

const body = z
  .object({
    name: z.string().trim().min(2).max(100),
    phoneNumber: z.string().trim().min(6).max(20),
  })
  .strict();
export const createAdminZodSchema = z.object({
  body: body.extend(createAccountZodSchema.omit({ role: true }).shape),
});
export const getAdminZodSchema = z.object({
  params: z.object({ id: objectId }),
});
export const updateAdminZodSchema = z.object({
  params: z.object({ id: objectId }),
  body: body
    .partial()
    .refine(
      value => Object.keys(value).length > 0,
      "At least one field is required",
    ),
});
export const listAdminsZodSchema = z.object({
  query: z
    .object({
      searchTerm: z.string().trim().max(100).optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      sortBy: z.enum(["createdAt", "updatedAt", "name"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    })
    .strict(),
});

export type CreateAdminDto = z.infer<typeof createAdminZodSchema>["body"];
export type UpdateAdminDto = z.infer<typeof updateAdminZodSchema>["body"];
export type ListAdminsQuery = z.infer<typeof listAdminsZodSchema>["query"];
