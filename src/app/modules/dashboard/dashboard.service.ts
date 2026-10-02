import httpStatus from "http-status";
import { FilterQuery, Types } from "mongoose";
import { queryDateSchema } from "../../../global/schema/global.schema";
import { AbstractService } from "../../core/abstract/AbstractService";
import { ApiError } from "../../errors/ApiError";
import { Doctor } from "../doctor/doctor.model";
import { TREATMENT_STATUS } from "../patient/patient.constant";
import { IPatientDocument, Patient } from "../patient/patient.model";

const treatmentStatusLabels: Record<TREATMENT_STATUS, string> = {
  [TREATMENT_STATUS.ACTIVE]: "Active",
  [TREATMENT_STATUS.UNDER_OBSERVATION]: "Under observation",
  [TREATMENT_STATUS.RECOVERED]: "Recovered",
};

export class DashboardService extends AbstractService {
  async getOverview(followUpDate?: string | Date) {
    const followUpFilter: FilterQuery<IPatientDocument> = {
      isDeleted: false,
      followUpDate: { $ne: null },
    };

    if (followUpDate !== undefined) {
      const end = new Date(followUpDate);
      end.setUTCDate(end.getUTCDate() + 1);
      followUpFilter.followUpDate = { $gte: new Date(followUpDate), $lt: end };
    }

    // Use UTC boundaries, matching the existing patient query date schema.
    const now = new Date();
    const months = Array.from(
      { length: 6 },
      (_, index) =>
        new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
        ),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const dateRange = { $gte: months[0], $lt: end };

    const [
      totalFollowUps,
      activeDoctors,
      recentDoctors,
      treatmentStatusRaw,
      newPatientsRaw,
      followUpsRaw,
    ] = await Promise.all([
      Patient.countDocuments(followUpFilter),
      Doctor.countDocuments({ isDeleted: false, isActive: true }),
      Doctor.find({ isDeleted: false })
        .select("name medicalRegistrationNo")
        .sort({ createdAt: -1, _id: 1 })
        .limit(5)
        .lean(),
      Patient.aggregate<{ _id: TREATMENT_STATUS; value: number }>([
        { $match: { isDeleted: false } },
        { $group: { _id: "$treatmentStatus", value: { $sum: 1 } } },
      ]),
      Patient.aggregate<{ _id: string; count: number }>([
        { $match: { isDeleted: false, createdAt: dateRange } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      Patient.aggregate<{ _id: string; count: number }>([
        { $match: { isDeleted: false, followUpDate: dateRange } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$followUpDate" } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const patientsPerDoctorRaw = recentDoctors.length
      ? await Patient.aggregate<{ _id: Types.ObjectId; patientsCount: number }>(
          [
            {
              $match: {
                isDeleted: false,
                doctorId: { $in: recentDoctors.map(doctor => doctor._id) },
              },
            },
            { $group: { _id: "$doctorId", patientsCount: { $sum: 1 } } },
          ],
        )
      : [];

    const doctorCounts = new Map(
      patientsPerDoctorRaw.map(row => [row._id.toString(), row.patientsCount]),
    );
    const statusCounts = new Map(
      treatmentStatusRaw.map(row => [row._id, row.value]),
    );
    const newPatientsCounts = new Map(
      newPatientsRaw.map(row => [row._id, row.count]),
    );
    const followUpCounts = new Map(
      followUpsRaw.map(row => [row._id, row.count]),
    );

    return {
      totalFollowUps,
      activeDoctors,
      patientsOverview: months.map(date => {
        const key = date.toISOString().slice(0, 7);
        return {
          month: date.toLocaleString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
          newPatients: newPatientsCounts.get(key) ?? 0,
          followUps: followUpCounts.get(key) ?? 0,
        };
      }),
      patientsPerDoctor: recentDoctors.map(doctor => ({
        doctorId: doctor._id,
        name: doctor.name,
        medicalRegistrationNo: doctor.medicalRegistrationNo,
        patientsCount: doctorCounts.get(doctor._id.toString()) ?? 0,
      })),
      treatmentStatus: Object.values(TREATMENT_STATUS).map(status => ({
        name: treatmentStatusLabels[status],
        value: statusCounts.get(status) ?? 0,
      })),
    };
  }
}
