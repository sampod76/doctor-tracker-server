/**
 * users.ts — application-level user enums.
 *
 * Single source of truth for the three user roles the boilerplate knows about.
 * Stored on the User document and validated by Mongoose, Zod, and RBAC code.
 */
export enum USER_ROLE {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
}

export const USER_TYPE_ARRAY = Object.values(USER_ROLE);
export type I_USER_TYPE = keyof typeof USER_ROLE;

export enum ENUM_GENDER {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export const GENDER_ARRAY = Object.values(ENUM_GENDER);
export type I_GENDER = keyof typeof ENUM_GENDER;
