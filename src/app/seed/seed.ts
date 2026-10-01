import httpStatus from "http-status";
import { USER_ROLE } from "../../global/enums/users";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { ApiError } from "../errors/ApiError";
import { Admin } from "../modules/admin/admin.model";
import { SPECIALIZATION } from "../modules/doctor/doctor.constant";
import { Doctor } from "../modules/doctor/doctor.model";
import { IUserDocument, User } from "../modules/user/user.model";
import { UserService } from "../modules/user/user.service";

const defaultAdmin = {
  name: "Samantha Reed",
  email: "admin@doctortracker.com",
  password: "Admin@12345",
  phoneNumber: "01711000000",
};

const defaultDoctor = {
  name: "Dr. Emily Carter",
  email: "emily.carter@doctortracker.com",
  password: "Doctor@12345",
  phoneNumber: "01812000000",
  hospital: "Green Valley Medical Center",
  specialization: SPECIALIZATION.GENERAL_MEDICINE,
};

export async function seedDatabase(): Promise<void> {
  const userService = new UserService();
  const session = await User.db.startSession();

  try {
    await session.withTransaction(async () => {
      // Seed default admin
      let adminUser: IUserDocument | null = await User.findOne({
        email: defaultAdmin.email,
      }).session(session);

      if (!adminUser) {
        adminUser = await userService.createAccount(
          {
            email: defaultAdmin.email,
            password: defaultAdmin.password,
            role: USER_ROLE.ADMIN,
          },
          session,
        );

        console.log("Default admin user created");
      } else {
        if (adminUser.role !== USER_ROLE.ADMIN) {
          throw new ApiError(
            httpStatus.CONFLICT,
            "Default admin email belongs to a different role",
          );
        }

        console.log("Default admin user already exists");
      }

      const admin = await Admin.findOne({
        userId: adminUser._id,
      }).session(session);

      if (!admin) {
        await Admin.create(
          [
            {
              userId: adminUser._id,
              name: defaultAdmin.name,
              phoneNumber: defaultAdmin.phoneNumber,
            },
          ],
          { session },
        );

        console.log("Default admin profile created");
      } else {
        console.log("Default admin profile already exists");
      }

      // Seed default doctor
      let doctorUser: IUserDocument | null = await User.findOne({
        email: defaultDoctor.email,
      }).session(session);

      if (!doctorUser) {
        doctorUser = await userService.createAccount(
          {
            email: defaultDoctor.email,
            password: defaultDoctor.password,
            role: USER_ROLE.DOCTOR,
          },
          session,
        );

        console.log("Default doctor user created");
      } else {
        if (doctorUser.role !== USER_ROLE.DOCTOR) {
          throw new ApiError(
            httpStatus.CONFLICT,
            "Default doctor email belongs to a different role",
          );
        }

        console.log("Default doctor user already exists");
      }

      const doctor = await Doctor.findOne({
        $or: [{ userId: doctorUser._id }, { email: defaultDoctor.email }],
      }).session(session);

      if (!doctor) {
        await Doctor.create(
          [
            {
              userId: doctorUser._id,
              createdBy: adminUser._id,
              name: defaultDoctor.name,
              email: doctorUser.email,
              phone: defaultDoctor.phoneNumber,
              hospital: defaultDoctor.hospital,
              specialization: defaultDoctor.specialization,
            },
          ],
          { session },
        );

        console.log("Default doctor created");
      } else {
        if (
          !doctor.userId.equals(doctorUser._id) ||
          !doctor.createdBy.equals(adminUser._id) ||
          doctor.email !== doctorUser.email
        ) {
          throw new ApiError(
            httpStatus.CONFLICT,
            "Default doctor has conflicting account or creator references",
          );
        }

        console.log("Default doctor already exists");
      }
    });
  } finally {
    await session.endSession();
  }
}

async function main(): Promise<void> {
  try {
    await connectDatabase();

    await Promise.all([User.init(), Admin.init(), Doctor.init()]);

    await seedDatabase();

    console.log("Database seed completed");
  } catch (error) {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  } finally {
    try {
      await disconnectDatabase();
    } catch (error) {
      console.error("Failed to close database connection:", error);
      process.exitCode = 1;
    }
  }
}

if (require.main === module) {
  void main();
}
