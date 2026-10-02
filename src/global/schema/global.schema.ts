import { Types } from "mongoose";
import { z } from "zod";
export const objectId = z
  .string()
  .refine(value => Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId",
  });
export const queryDateSchema = z
  .string()
  .date()
  .transform(value => new Date(`${value}T00:00:00.000Z`));
export const BasicRequestQueryParams = z
  .object({
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    limit: z.coerce.number().int().max(999999).default(20).optional(),
    page: z.coerce.number().int().default(1).optional(),
    createdAtFrom: z.coerce.date().optional(),
    createdAtTo: z.coerce.date().optional(),
  })
  .strict();
