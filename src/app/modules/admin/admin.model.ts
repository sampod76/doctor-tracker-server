import { Document, model, Schema, Types } from "mongoose";
export interface IAdminDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  phoneNumber: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
const adminSchema = new Schema<IAdminDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phoneNumber: { type: String, required: true, trim: true, maxlength: 20 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);
adminSchema.index({ isDeleted: 1, createdAt: -1 });

export const Admin = model<IAdminDocument>("Admin", adminSchema);
