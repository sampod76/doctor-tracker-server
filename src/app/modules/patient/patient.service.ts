import httpStatus from "http-status";
import { Document, FilterQuery, PipelineStage, Types } from "mongoose";

import { AbstractService } from "../../core/abstract/AbstractService";
import { ApiError } from "../../errors/ApiError";
import { Doctor } from "../doctor/doctor.model";

import { PATIENT_SEARCHABLE_FIELDS } from "./patient.constant";
import { IPatientDocument, Patient } from "./patient.model";
import {
  CreatePatientDto,
  ListPatientsQuery,
  UpdatePatientDto,
} from "./patient.validation";

const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class PatientService extends AbstractService {
  private validateId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid id");
    }
  }

  private async validateDoctor(doctorId: string): Promise<void> {
    this.validateId(doctorId);

    const doctor = await Doctor.exists({
      _id: doctorId,
      isDeleted: false,
      isActive: true,
    });

    if (!doctor) {
      throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
    }
  }

  async create(payload: CreatePatientDto) {
    await this.validateDoctor(payload.doctorId);

    return Patient.create(payload);
  }

  async findOne(id: string) {
    this.validateId(id);

    const [patient] = await Patient.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      {
        $unwind: {
          path: "$doctor",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          doctorId: 0,
          "doctor.isDeleted": 0,
          "doctor.deletedAt": 0,
          "doctor.createdAt": 0,
          "doctor.updatedAt": 0,
          "doctor.__v": 0,
        },
      },
    ]);

    if (!patient) {
      throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
    }

    return patient;
  }

  private buildFilter(query: ListPatientsQuery): FilterQuery<IPatientDocument> {
    const {
      searchTerm,
      doctorId,
      gender,
      treatmentStatus,
      followUpDate,
      lastVisitAt,
    } = query;

    const filter: FilterQuery<IPatientDocument> = {
      isDeleted: false,
    };

    if (searchTerm) {
      filter.$or = PATIENT_SEARCHABLE_FIELDS.map(field => ({
        [field]: {
          $regex: escapeRegex(searchTerm),
          $options: "i",
        },
      }));
    }

    if (doctorId) {
      this.validateId(doctorId);
      filter.doctorId = new Types.ObjectId(doctorId);
    }

    if (gender) {
      filter.gender = gender;
    }

    if (treatmentStatus) {
      filter.treatmentStatus = treatmentStatus;
    }

    if (followUpDate) {
      filter.followUpDate = followUpDate;
    }

    if (lastVisitAt) {
      filter.lastVisitAt = lastVisitAt;
    }

    return filter;
  }

  async findAll(query: ListPatientsQuery) {
    const { page, limit, skip, sortBy, sortOrder } =
      this.calculatePagination(query);

    const whereConditions = this.buildFilter(query);

    const sortConditions = this.parseSort(`${sortBy}:${sortOrder}`);

    const pipeline: PipelineStage[] = [
      {
        $match: whereConditions,
      },
      {
        $facet: {
          data: [
            {
              $sort: {
                ...sortConditions,
                _id: 1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
            {
              $lookup: {
                from: "doctors",
                localField: "doctorId",
                foreignField: "_id",
                as: "doctor",
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                phone: 1,
                doctorId: 1,
                age: 1,
                gender: 1,
                treatmentStatus: 1,
                lastVisitAt: 1,
                followUpDate: 1,
                createdAt: 1,
                "doctor.name": 1,
                "doctor.medicalRegistrationNo": 1,
                "doctor.phone": 1,
                "doctor.specialization": 1,
              },
            },
          ],

          countDocuments: [
            {
              $count: "totalData",
            },
          ],
        },
      },
    ];

    const [result] = await Patient.aggregate<{
      data: Array<
        Omit<IPatientDocument, keyof Document> & {
          _id: Types.ObjectId;
        }
      >;

      countDocuments: {
        totalData: number;
      }[];
    }>(pipeline);

    const data = result?.data ?? [];
    const total = result?.countDocuments[0]?.totalData ?? 0;

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async update(id: string, payload: UpdatePatientDto) {
    this.validateId(id);

    if (payload.doctorId) {
      await this.validateDoctor(payload.doctorId);
    }

    const patient = await Patient.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        $set: payload,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!patient) {
      throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
    }

    return patient;
  }

  async softDelete(id: string) {
    this.validateId(id);

    const patient = await Patient.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!patient) {
      throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
    }

    return patient;
  }

  async statistics(doctorId?: string) {
    if (doctorId) {
      this.validateId(doctorId);
    }

    const now = new Date();

    const match: FilterQuery<IPatientDocument> = {
      isDeleted: false,
    };

    if (doctorId) {
      match.doctorId = new Types.ObjectId(doctorId);
    }

    const [result] = await Patient.aggregate([
      {
        $match: match,
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,

                total: {
                  $sum: 1,
                },

                active: {
                  $sum: {
                    $cond: [
                      {
                        $eq: ["$treatmentStatus", "ACTIVE"],
                      },
                      1,
                      0,
                    ],
                  },
                },

                underObservation: {
                  $sum: {
                    $cond: [
                      {
                        $eq: ["$treatmentStatus", "UNDER_OBSERVATION"],
                      },
                      1,
                      0,
                    ],
                  },
                },

                recovered: {
                  $sum: {
                    $cond: [
                      {
                        $eq: ["$treatmentStatus", "RECOVERED"],
                      },
                      1,
                      0,
                    ],
                  },
                },

                upcomingFollowUps: {
                  $sum: {
                    $cond: [
                      {
                        $gte: ["$followUpDate", now],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],

          byGender: [
            {
              $group: {
                _id: "$gender",
                count: {
                  $sum: 1,
                },
              },
            },
          ],

          byTreatmentStatus: [
            {
              $group: {
                _id: "$treatmentStatus",
                count: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
    ]);

    const totals = result?.totals?.[0];

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
}
