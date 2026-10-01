import httpStatus from "http-status";
import { Document, FilterQuery, PipelineStage, Types } from "mongoose";
import { USER_ROLE } from "../../../global/enums/users";
import { AbstractService } from "../../core/abstract/AbstractService";
import { ApiError } from "../../errors/ApiError";
import { IUserRef } from "../../interfaces/user.ref";
import { User } from "../user/user.model";
import { UserService } from "../user/user.service";
import { DOCTOR_SEARCHABLE_FIELDS, SPECIALIZATION } from "./doctor.constant";
import { Doctor, IDoctorDocument } from "./doctor.model";
import {
  CreateDoctorDto,
  ListDoctorsQuery,
  UpdateDoctorDto,
} from "./doctor.validation";
const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export class DoctorService extends AbstractService {
  constructor(private readonly userService: UserService) {
    super();
  }
  async statistics() {
    const [result] = await Doctor.aggregate<{
      totals: { total: number; active: number; inactive: number }[];
      bySpecialization: { _id: SPECIALIZATION; count: number }[];
    }>([
      { $match: { isDeleted: false } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: ["$isActive", 1, 0] } },
                inactive: { $sum: { $cond: ["$isActive", 0, 1] } },
              },
            },
          ],
          bySpecialization: [
            { $group: { _id: "$specialization", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);
    const totals = result?.totals[0];
    return {
      total: totals?.total ?? 0,
      active: totals?.active ?? 0,
      inactive: totals?.inactive ?? 0,
      bySpecialization: result?.bySpecialization ?? [],
    };
  }
  private validateId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid doctor id");
  }

  async create(payload: CreateDoctorDto, authUser: IUserRef) {
    const session = await Doctor.db.startSession();
    try {
      return await session.withTransaction(async () => {
        const user = await this.userService.createAccount(
          {
            email: payload.email,
            password: payload.password,
            role: USER_ROLE.DOCTOR,
          },
          session,
        );
        const [doctor] = await Doctor.create(
          [
            {
              userId: user._id,
              createdBy: authUser.userId,
              name: payload.name,
              email: user.email,
              specialization: payload.specialization,
              hospital: payload.hospital,
              phone: payload.phone,
              isActive: payload.isActive,
            },
          ],
          { session },
        );
        return doctor;
      });
    } finally {
      await session.endSession();
    }
  }
  async findOne(id: string, authUser: IUserRef) {
    this.validateId(id);
    const filter = { _id: id, isDeleted: false };
    const result = await Doctor.findOne(filter)
      .populate({
        path: "userId",
        match: { isDeleted: false },
        select: "email role isActive",
      })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select: "email role",
      })
      .lean();
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
    return result;
  }
  private buildFilter(query: ListDoctorsQuery): FilterQuery<IDoctorDocument> {
    const { searchTerm, ...filtersData } = query;
    const andConditions: FilterQuery<IDoctorDocument>[] = [
      { isDeleted: false },
    ];
    if (searchTerm) {
      andConditions.push({
        $or: DOCTOR_SEARCHABLE_FIELDS.map(field => ({
          [field]: { $regex: escapeRegex(searchTerm), $options: "i" },
        })),
      });
    }
    if (filtersData.specialization !== undefined)
      andConditions.push({ specialization: filtersData.specialization });
    if (filtersData.hospital !== undefined)
      andConditions.push({ hospital: filtersData.hospital });
    if (filtersData.isActive !== undefined)
      andConditions.push({ isActive: filtersData.isActive });
    return andConditions.length > 0 ? { $and: andConditions } : {};
  }
  async findAll(query: ListDoctorsQuery, authUser: IUserRef) {
    const { page, limit, skip, sortBy, sortOrder } =
      this.calculatePagination(query);
    const whereConditions = this.buildFilter(query);
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
    const pipelineResult = await Doctor.aggregate<{
      data: Array<
        Omit<IDoctorDocument, keyof Document> & { _id: Types.ObjectId }
      >;
      countDocuments: { totalData: number }[];
    }>(pipeline);
    const data = pipelineResult[0]?.data ?? [];
    const total = pipelineResult[0]?.countDocuments[0]?.totalData ?? 0;
    return { data, meta: { page, limit, total } };
  }
  async update(id: string, payload: UpdateDoctorDto, authUser: IUserRef) {
    this.validateId(id);
    const filter = { _id: id, isDeleted: false };

    const result = await Doctor.findOneAndUpdate(
      filter,
      { $set: payload },
      { new: true, runValidators: true },
    );
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
    return result;
  }
  async softDelete(id: string, authUser: IUserRef) {
    this.validateId(id);
    const filter = { _id: id, isDeleted: false };
    const result = await Doctor.findOneAndUpdate(
      filter,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
    return result;
  }
  async restore(id: string, authUser: IUserRef) {
    this.validateId(id);
    const existing = await Doctor.findOne({ _id: id, isDeleted: true })
      .select("userId")
      .lean();
    if (!existing)
      throw new ApiError(httpStatus.NOT_FOUND, "Deleted doctor not found");
    if (
      !(await User.exists({
        _id: existing.userId,
        role: USER_ROLE.DOCTOR,
        isDeleted: false,
        isActive: true,
      }))
    )
      throw new ApiError(httpStatus.CONFLICT, "Active doctor account required");
    const result = await Doctor.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true, runValidators: true },
    );
    if (!result)
      throw new ApiError(httpStatus.NOT_FOUND, "Deleted doctor not found");
    return result;
  }
}
