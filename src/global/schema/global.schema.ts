import { z } from "zod";

export const zodSlugSchema = z.string().transform(val =>
  val
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase(),
);

export const zodYMDdateSchema = z
  .string({
    required_error: "Date is required",
    invalid_type_error: "Date must be a string",
  })
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  .refine(
    value => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    { message: "Invalid calendar date" },
  );

export const defaultField = z.object({
  id: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  is_deleted: z.boolean().optional(),
});

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
