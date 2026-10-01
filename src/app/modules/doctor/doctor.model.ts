import { Document, model, Schema, Types } from "mongoose";
import { SPECIALIZATION } from "./doctor.constant";
export interface IDoctorDocument extends Document {
  userId: Types.ObjectId;
  createdBy: Types.ObjectId;
  name: string;
  email: string;
  specialization: SPECIALIZATION;
  hospital: string;
  phone: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
const doctorSchema = new Schema<IDoctorDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    specialization: {
      type: String,
      enum: Object.values(SPECIALIZATION),
      required: true,
    },
    hospital: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
  },
);
doctorSchema.index({ isDeleted: 1, createdAt: -1 });
doctorSchema.index({ specialization: 1, isDeleted: 1, isActive: 1 });

export const Doctor = model<IDoctorDocument>("Doctor", doctorSchema);
