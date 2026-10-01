import { z } from "zod";

export const loginZodSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),
});

export const refreshTokenZodSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

export const logoutZodSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10).optional(),
  }),
});

export const changePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),
});

export const forgotPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
  }),
});

export const setOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    otp: z.string().length(6),
    newPassword: z.string().min(8).max(128),
  }),
});

export const resendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
  }),
});

export type LoginDto = z.infer<typeof loginZodSchema>["body"];
export type ChangePasswordDto = z.infer<typeof changePasswordZodSchema>["body"];
