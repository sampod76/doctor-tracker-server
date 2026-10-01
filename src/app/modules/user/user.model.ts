import { Document, Schema, model } from "mongoose";

import { USER_ROLE } from "../../../global/enums/users";

export interface IUserDocument extends Document {
  email: string;
  password: string;
  role: USER_ROLE;

  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
      maxlength: 128,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      required: true,

      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_document, result) => {
        delete (result as { password?: string }).password;
        return result;
      },
    },
  },
);

userSchema.index({ isDeleted: 1, createdAt: -1 });

export const User = model<IUserDocument>("User", userSchema);
