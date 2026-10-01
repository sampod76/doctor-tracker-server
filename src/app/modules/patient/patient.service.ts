import httpStatus from "http-status";
import { Document, FilterQuery, PipelineStage, Types } from "mongoose";
import { AbstractService } from "../../core/abstract/AbstractService";
import { ApiError } from "../../errors/ApiError";
import { IUserRef } from "../../interfaces/user.ref";
import { USER_ROLE, ENUM_GENDER } from "../../../global/enums/users";
import {
  PATIENT_SEARCHABLE_FIELDS,
  TREATMENT_STATUS,
} from "./patient.constant";
import { Doctor } from "../doctor/doctor.model";
import { Patient, IPatientDocument } from "./patient.model";
import {
  CreatePatientDto,
  UpdatePatientDto,
  ListPatientsQuery,
} from "./patient.validation";
const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export class PatientService extends AbstractService {
  async statistics(authUser: IUserRef, requestedDoctorId?: string) {
    const doctorId = await this.doctorScope(authUser, requestedDoctorId);
    const now = new Date();
    const [result] = await Patient.aggregate<{
      totals: {
        total: number;
        active: number;
        underObservation: number;
        recovered: number;
        upcomingFollowUps: number;
      }[];
      byGender: { _id: ENUM_GENDER; count: number }[];
      byTreatmentStatus: { _id: TREATMENT_STATUS; count: number }[];
    }>([
      {
        $match: {
          isDeleted: false,
          ...(doctorId ? { doctorId: new Types.ObjectId(doctorId) } : {}),
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: {
                    $cond: [
                      { $eq: ["$treatmentStatus", TREATMENT_STATUS.ACTIVE] },
                      1,
                      0,
                    ],
                  },
                },
                underObservation: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$treatmentStatus",
                          TREATMENT_STATUS.UNDER_OBSERVATION,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                recovered: {
                  $sum: {
                    $cond: [
                      { $eq: ["$treatmentStatus", TREATMENT_STATUS.RECOVERED] },
                      1,
                      0,
                    ],
                  },
                },
                upcomingFollowUps: {
                  $sum: { $cond: [{ $gte: ["$followUpDate", now] }, 1, 0] },
                },
              },
            },
          ],
          byGender: [
            { $group: { _id: "$gender", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          byTreatmentStatus: [
            { $group: { _id: "$treatmentStatus", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);
    const totals = result?.totals[0];
    return {
      total: totals?.total ?? 0,
      active: totals?.active ?? 0,
      underObservation: totals?.underObservation ?? 0,
      recovered: totals?.recovered ?? 0,
      upcomingFollowUps: totals?.upcomingFollowUps ?? 0,
      byGender: result?.byGender ?? [],
      byTreatmentStatus: result?.byTreatmentStatus ?? [],
    };
  }
  private validateId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid patient id");
  }
  private async doctorScope(
    authUser: IUserRef,
    doctorId?: string,
  ): Promise<string | undefined> {
    if (doctorId) {
      this.validateId(doctorId);
      doctorId = new Types.ObjectId(doctorId).toHexString();
    }
    if (authUser.role === USER_ROLE.DOCTOR) {
      const doctor = await Doctor.findOne({
        userId: authUser.userId,
        isDeleted: false,
        isActive: true,
      })
        .select("_id")
        .lean();
      if (!doctor)
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Active doctor profile required",
        );
      const ownId = doctor._id.toString();
      if (doctorId && doctorId !== ownId)
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Patient belongs to another doctor",
        );
      return ownId;
    }
    if (doctorId) {
      const doctor = await Doctor.findOne({
        _id: doctorId,
        isDeleted: false,
        isActive: true,
      })
        .select("_id")
        .lean();
      if (!doctor)
        throw new ApiError(httpStatus.NOT_FOUND, "Active doctor not found");
    }
    return doctorId;
  }
  private async accessFilter(
    id: string,
    authUser: IUserRef,
  ): Promise<FilterQuery<IPatientDocument>> {
    this.validateId(id);
    const doctorId = await this.doctorScope(authUser);
    return { _id: id, isDeleted: false, ...(doctorId ? { doctorId } : {}) };
  }

  async create(payload: CreatePatientDto, authUser: IUserRef) {
    const doctorId = await this.doctorScope(authUser, payload.doctorId);
    return Patient.create({ ...payload, doctorId });
  }
  async findOne(id: string, authUser: IUserRef) {
    const filter = await this.accessFilter(id, authUser);
    const result = await Patient.findOne(filter)
      .populate({
        path: "doctorId",
        match: { isDeleted: false },
        select: "name email specialization hospital phone",
      })
      .lean();
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
    return result;
  }
  private buildFilter(query: ListPatientsQuery): FilterQuery<IPatientDocument> {
    const { searchTerm, ...filtersData } = query;
    const andConditions: FilterQuery<IPatientDocument>[] = [
      { isDeleted: false },
    ];
    if (searchTerm) {
      andConditions.push({
        $or: PATIENT_SEARCHABLE_FIELDS.map(field => ({
          [field]: { $regex: escapeRegex(searchTerm), $options: "i" },
        })),
      });
    }
    if (filtersData.doctorId !== undefined) {
      this.validateId(filtersData.doctorId);
      andConditions.push({
        doctorId: new Types.ObjectId(filtersData.doctorId),
      });
    }
    if (filtersData.gender !== undefined)
      andConditions.push({ gender: filtersData.gender });
    if (filtersData.treatmentStatus !== undefined)
      andConditions.push({ treatmentStatus: filtersData.treatmentStatus });
    if (filtersData.followUpDate !== undefined)
      andConditions.push({ followUpDate: filtersData.followUpDate });
    if (filtersData.lastVisitAt !== undefined)
      andConditions.push({ lastVisitAt: filtersData.lastVisitAt });
    return andConditions.length > 0 ? { $and: andConditions } : {};
  }
  async findAll(query: ListPatientsQuery, authUser: IUserRef) {
    const { page, limit, skip, sortBy, sortOrder } =
      this.calculatePagination(query);
    const doctorId = await this.doctorScope(authUser, query.doctorId);
    const whereConditions = this.buildFilter({ ...query, doctorId });
    const sortConditions = this.parseSort(`${sortBy}:${sortOrder}`);
    const pipeline: PipelineStage[] = [
      { $match: whereConditions },
      {
        $facet: {
          data: [
            { $sort: { ...sortConditions, _id: 1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          countDocuments: [{ $count: "totalData" }],
        },
      },
    ];
    const pipelineResult = await Patient.aggregate<{
      data: Array<
        Omit<IPatientDocument, keyof Document> & { _id: Types.ObjectId }
      >;
      countDocuments: { totalData: number }[];
    }>(pipeline);
    const data = pipelineResult[0]?.data ?? [];
    const total = pipelineResult[0]?.countDocuments[0]?.totalData ?? 0;
    return { data, meta: { page, limit, total } };
  }
  async update(id: string, payload: UpdatePatientDto, authUser: IUserRef) {
    const filter = await this.accessFilter(id, authUser);
    if (payload.doctorId) await this.doctorScope(authUser, payload.doctorId);
    const result = await Patient.findOneAndUpdate(
      filter,
      { $set: payload },
      { new: true, runValidators: true },
    );
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
    return result;
  }
  async softDelete(id: string, authUser: IUserRef) {
    const filter = await this.accessFilter(id, authUser);
    const result = await Patient.findOneAndUpdate(
      filter,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
    return result;
  }
  async restore(id: string, authUser: IUserRef) {
    this.validateId(id);
    const existing = await Patient.findOne({ _id: id, isDeleted: true })
      .select("doctorId")
      .lean();
    if (!existing)
      throw new ApiError(httpStatus.NOT_FOUND, "Deleted patient not found");
    await this.doctorScope(authUser, existing.doctorId.toString());
    const result = await Patient.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true, runValidators: true },
    );
    if (!result)
      throw new ApiError(httpStatus.NOT_FOUND, "Deleted patient not found");
    return result;
  }
}
