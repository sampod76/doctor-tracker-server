import { Document, model, Schema, Types } from "mongoose";
import { ENUM_GENDER } from "../../../global/enums/users";
import { TREATMENT_STATUS } from "./patient.constant";
export interface IPatientDocument extends Document {
  name: string;
  phone: string;
  doctorId: Types.ObjectId;
  age: number;
  gender: ENUM_GENDER;
  address?: string;
  patientComplaint: string;
  doctorAdvice?: string;
  notes?: string;
  treatmentStatus: TREATMENT_STATUS;
  lastVisitAt?: Date | null;
  followUpDate?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const patientSchema = new Schema<IPatientDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 150,
    },
    gender: { type: String, enum: Object.values(ENUM_GENDER), required: true },
    address: { type: String, trim: true, maxlength: 500 },
    patientComplaint: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    doctorAdvice: { type: String, trim: true, maxlength: 5000 },
    notes: { type: String, trim: true, maxlength: 5000 },
    treatmentStatus: {
      type: String,
      enum: Object.values(TREATMENT_STATUS),
      default: TREATMENT_STATUS.ACTIVE,
    },
    lastVisitAt: { type: Date, default: null },
    followUpDate: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

patientSchema.index({ doctorId: 1, isDeleted: 1, createdAt: -1 });
patientSchema.index({
  doctorId: 1,
  isDeleted: 1,
  phone: 1,
});
export const Patient = model<IPatientDocument>("Patient", patientSchema);
