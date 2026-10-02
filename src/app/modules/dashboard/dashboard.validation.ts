import z from "zod";
import { queryDateSchema } from "../../../global/schema/global.schema";

export const listDoctorsZodSchema = z.object({
  query: z
    .object({
      followUpDate: queryDateSchema.optional(),
    })
    .strict(),
});
