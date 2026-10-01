import { z } from "zod";

import { USER_ROLE } from "../../../global/enums/users";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid ObjectId");

export const createAccountZodSchema = z
  .object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(128),
    role: z.nativeEnum(USER_ROLE),
  })
  .strict();

export const updateUserZodSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    email: z.string().email().toLowerCase().optional(),
    password: z.string().min(8).max(128).optional(),
    role: z.nativeEnum(USER_ROLE).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getUserZodSchema = z.object({
  params: z.object({ id: objectId }),
});

export const listUsersZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sortBy: z
      .enum([
        "_id",
        "email",
        "role",
        "isActive",
        "isDeleted",
        "deletedAt",
        "createdAt",
        "updatedAt",
      ])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    role: z.nativeEnum(USER_ROLE).optional(),
    isActive: z
      .enum(["true", "false"])
      .transform(value => value === "true")
      .optional(),
    isDeleted: z
      .enum(["true", "false"])
      .transform(value => value === "true")
      .optional(),
    ids: z.string().optional(),
  }),
});

export type CreateAccountDto = z.infer<typeof createAccountZodSchema>;
export type UpdateUserDto = z.infer<typeof updateUserZodSchema>["body"];
export type ListUsersQuery = z.infer<typeof listUsersZodSchema>["query"];
