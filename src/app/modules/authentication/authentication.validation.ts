import { z } from "zod";

const loginZodSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),
});

const refreshTokenZodSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),
});

export type LoginDto = z.infer<typeof loginZodSchema>["body"];
export type ChangePasswordDto = z.infer<typeof changePasswordZodSchema>["body"];

export const AuthValidation = {
  loginZodSchema,
  refreshTokenZodSchema,
  changePasswordZodSchema,
};
