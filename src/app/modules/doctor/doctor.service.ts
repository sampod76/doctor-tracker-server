import httpStatus from "http-status";
import { FilterQuery, PipelineStage, Types } from "mongoose";
import { USER_ROLE } from "../../../global/enums/users";
import { AbstractService } from "../../core/abstract/AbstractService";
import { ApiError } from "../../errors/ApiError";
import { IUserRef } from "../../interfaces/user.ref";
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

  private async validateRegistrationNumber(
    medicalRegistrationNo: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await Doctor.exists({
      medicalRegistrationNo: medicalRegistrationNo.trim(),
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (existing) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Medical registration number already exists",
      );
    }
  }

  async create(payload: CreateDoctorDto, authUser: IUserRef) {
    await this.validateRegistrationNumber(payload.medicalRegistrationNo);
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
              medicalRegistrationNo: payload.medicalRegistrationNo,
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
  async findOne(id: string) {
    this.validateId(id);

    const [result] = await Doctor.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userId: 0,

          "user.password": 0,
          "user.isDeleted": 0,
          "user.deletedAt": 0,
          "user.createdAt": 0,
          "user.updatedAt": 0,

          "createdBy.password": 0,
          "createdBy.isDeleted": 0,
          "createdBy.deletedAt": 0,
          "createdBy.createdAt": 0,
          "createdBy.updatedAt": 0,
        },
      },
    ]);

    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
    }

    return result;
  }
  private buildFilter(query: ListDoctorsQuery): FilterQuery<IDoctorDocument> {
    const {
      searchTerm,
      specialization,
      hospital,
      isActive,
      medicalRegistrationNo,
    } = query;

    const filter: FilterQuery<IDoctorDocument> = {
      isDeleted: false,
    };

    if (searchTerm) {
      filter.$or = DOCTOR_SEARCHABLE_FIELDS.map(field => ({
        [field]: {
          $regex: escapeRegex(searchTerm),
          $options: "i",
        },
      }));
    }

    if (specialization !== undefined) {
      filter.specialization = specialization;
    }

    if (hospital !== undefined) {
      filter.hospital = hospital;
    }

    if (medicalRegistrationNo !== undefined) {
      filter.medicalRegistrationNo = medicalRegistrationNo;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    return filter;
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

            {
              $lookup: {
                from: "patients",
                let: { doctorId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$doctorId", "$$doctorId"] },
                          { $eq: ["$isDeleted", false] },
                        ],
                      },
                    },
                  },
                  {
                    $count: "total",
                  },
                ],
                as: "patientStats",
              },
            },

            {
              $addFields: {
                patientsCount: {
                  $ifNull: [{ $arrayElemAt: ["$patientStats.total", 0] }, 0],
                },
              },
            },

            {
              $project: {
                patientStats: 0,
              },
            },
          ],

          countDocuments: [{ $count: "totalData" }],
        },
      },
    ];
    const pipelineResult = await Doctor.aggregate(pipeline);
    const data = pipelineResult[0]?.data ?? [];
    const total = pipelineResult[0]?.countDocuments[0]?.totalData ?? 0;
    return { data, meta: { page, limit, total } };
  }
  async update(id: string, payload: UpdateDoctorDto, authUser: IUserRef) {
    this.validateId(id);
    if (payload.medicalRegistrationNo !== undefined) {
      await this.validateRegistrationNumber(payload.medicalRegistrationNo, id);
    }
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
}
