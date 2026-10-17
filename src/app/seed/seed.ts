import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { ClientSession, Types } from "mongoose";
import { z } from "zod";

import { ENUM_GENDER, USER_ROLE } from "../../global/enums/users";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { env } from "../config/env";
import { ApiError } from "../errors/ApiError";
import { Admin } from "../modules/admin/admin.model";
import { SPECIALIZATION } from "../modules/doctor/doctor.constant";
import { Doctor } from "../modules/doctor/doctor.model";
import { TREATMENT_STATUS } from "../modules/patient/patient.constant";
import { Patient } from "../modules/patient/patient.model";
import { IUserDocument, User } from "../modules/user/user.model";
import {
  CreateAccountDto,
  createAccountZodSchema,
} from "../modules/user/user.validation";

const defaultAdmin = {
  name: "Samantha Reed",
  email: "admin@doctortracker.com",
  password: "Admin@12345",
  phone: "01711000000",
};

//
const SEED_DATA_PATH = path.resolve(
  process.cwd(),
  "scripts/doctor-patient-seed.json",
);

const SEED_BATCH_SIZE = 10;
const SEED_BATCH_DELAY_MS = 500;
const SEED_MAX_RETRIES = 3;

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

function normalizeSpecialization(specialization: string): SPECIALIZATION {
  if (
    specialization === "PULMONOLOGY" ||
    specialization === "ENDOCRINOLOGY" ||
    specialization === "GASTROENTEROLOGY"
  ) {
    return SPECIALIZATION.OTHER;
  }

  return z.nativeEnum(SPECIALIZATION).parse(specialization);
}

function normalizeTreatmentStatus(status: string): TREATMENT_STATUS {
  if (status === "COMPLETED") {
    return TREATMENT_STATUS.RECOVERED;
  }

  if (status === "ON_HOLD") {
    return TREATMENT_STATUS.UNDER_OBSERVATION;
  }

  return z.nativeEnum(TREATMENT_STATUS).parse(status);
}

const seedDataSchema = z.array(
  z.object({
    doctor: z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().toLowerCase(),
      password: createAccountZodSchema.shape.password,
      phone: z.string().trim().min(6).max(20),
      hospital: z.string().trim().min(2).max(200),
      specialization: z.string().transform(normalizeSpecialization),
    }),
    patients: z.array(
      z.object({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(6).max(20),
        age: z.number().int().min(0).max(150),
        gender: z.nativeEnum(ENUM_GENDER),
        address: z.string().trim().max(500),
        patientComplaint: z.string().trim().min(1).max(5000),
        doctorAdvice: z.string().trim().max(5000),
        notes: z.string().trim().max(5000).optional(),
        treatmentStatus: z.string().transform(normalizeTreatmentStatus),
        lastVisitAt: z.string().datetime({ offset: true }),
        followUpDate: z.string().datetime({ offset: true }),
      }),
    ),
  }),
);

type SeedItem = z.infer<typeof seedDataSchema>[number];

function getSeedData(): SeedItem[] {
  const rawData = fs.readFileSync(SEED_DATA_PATH, "utf-8");

  const seedData: unknown = JSON.parse(rawData);
  return seedDataSchema.parse(seedData);
}

async function createSeedUser(
  payload: CreateAccountDto,
  session: ClientSession,
): Promise<IUserDocument> {
  const account = createAccountZodSchema.parse(payload);
  const password = await bcrypt.hash(account.password, env.BCRYPT_SALT_ROUNDS);
  const [user] = await User.create([{ ...account, password }], { session });
  return user;
}

async function seedAdmin(session: ClientSession): Promise<IUserDocument> {
  let adminUser = await User.findOne({
    email: defaultAdmin.email,
  }).session(session);

  if (!adminUser) {
    // @ts-ignore
    adminUser = await createSeedUser(
      {
        email: defaultAdmin.email,
        password: defaultAdmin.password,
        role: USER_ROLE.ADMIN,
      },
      session,
    );

    console.log("Default admin user created");
  } else if (adminUser.role !== USER_ROLE.ADMIN) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Default admin email belongs to a different role",
    );
  } else {
    console.log("Default admin user already exists");
  }

  const admin = await Admin.findOne({
    // @ts-ignore
    userId: adminUser._id,
  }).session(session);

  if (!admin) {
    await Admin.create(
      [
        {
          // @ts-ignore
          userId: adminUser._id,
          name: defaultAdmin.name,
          phone: defaultAdmin.phone,
        },
      ],
      { session },
    );

    console.log("Default admin profile created");
  } else {
    console.log("Default admin profile already exists");
  }
  // @ts-ignore
  return adminUser;
}

type SeedReport = {
  doctorsFound: number;
  doctorsReused: number;
  doctorsCreated: number;
  patientsSkipped: number;
  patientsInserted: number;
  patientsAmbiguous: number;
  failedBatches: number;
};

function hasErrorLabel(error: unknown, label: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "hasErrorLabel" in error &&
    typeof error.hasErrorLabel === "function" &&
    error.hasErrorLabel(label)
  );
}

function isPermanentFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const code = "code" in error ? error.code : undefined;
  return (
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    error.name === "ZodError" ||
    error instanceof ApiError ||
    code === 11000 ||
    code === 121
  );
}

// withTransaction has its own retry window. Use explicit bounded retries instead.
// An uncertain commit retries only commit, never the writes in that transaction.
function createBatchRunner(session: ClientSession, report: SeedReport) {
  let hasRunBatch = false;
  return async function runBatch<T>(work: () => Promise<T>): Promise<T> {
    if (hasRunBatch) await sleep(SEED_BATCH_DELAY_MS);
    hasRunBatch = true;
    try {
      for (let attempt = 0; ; attempt++) {
        session.startTransaction({
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          maxCommitTimeMS: 10_000,
        });
        try {
          const result = await work();
          for (let commitAttempt = 0; ; commitAttempt++) {
            try {
              await session.commitTransaction();
              return result;
            } catch (error) {
              if (
                isPermanentFailure(error) ||
                !hasErrorLabel(error, "UnknownTransactionCommitResult") ||
                commitAttempt >= SEED_MAX_RETRIES
              )
                throw error;
              // No sleep here: this transaction's outcome is still uncertain.
            }
          }
        } catch (error) {
          const uncertainCommit = hasErrorLabel(
            error,
            "UnknownTransactionCommitResult",
          );
          if (session.inTransaction()) await session.abortTransaction();
          if (
            uncertainCommit ||
            isPermanentFailure(error) ||
            !hasErrorLabel(error, "TransientTransactionError") ||
            attempt >= SEED_MAX_RETRIES
          )
            throw error;
          // The aborted transaction is closed before the retry delay.
          await sleep(SEED_BATCH_DELAY_MS);
        }
      }
    } catch (error) {
      report.failedBatches++;
      throw error;
    }
  };
}

const normalizeName = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLowerCase();
const normalizePhone = (value: string): string =>
  value.trim().replace(/[\s().-]/g, "");
const registrationNumber = (index: number): string =>
  `BMDC-SEED-${String(index + 1).padStart(5, "0")}`;

type PatientIdentity = { name: string; phone: string; isDeleted?: boolean };

function indexPatientIdentities(patients: PatientIdentity[]) {
  const exact = new Map<string, PatientIdentity[]>();
  const names = new Map<string, number>();
  const phones = new Map<string, number>();
  let incomplete = false;
  for (const patient of patients) {
    const name = normalizeName(patient.name || "");
    const phone = normalizePhone(patient.phone || "");
    if (!name || !/^\+?\d{6,20}$/.test(phone)) incomplete = true;
    const key = JSON.stringify([name, phone]);
    const matches = exact.get(key) ?? [];
    matches.push(patient);
    exact.set(key, matches);
    names.set(name, (names.get(name) ?? 0) + 1);
    phones.set(phone, (phones.get(phone) ?? 0) + 1);
  }
  return { exact, names, phones, incomplete };
}

async function seedDoctorsAndPatients(
  seedData: SeedItem[],
  adminUser: IUserDocument,
  session: ClientSession,
  runBatch: ReturnType<typeof createBatchRunner>,
  report: SeedReport,
): Promise<void> {
  const emails = seedData.map(item => item.doctor.email);
  const users = await User.find({ email: { $in: emails } }).select(
    "_id email role isDeleted",
  );
  const usersByEmail = new Map(users.map(user => [user.email, user]));
  const doctors = await Doctor.find({
    $or: [
      { email: { $in: emails } },
      { userId: { $in: users.map(user => user._id) } },
      {
        medicalRegistrationNo: {
          $in: seedData.map((_, index) => registrationNumber(index)),
        },
      },
    ],
  }).select("_id userId email medicalRegistrationNo isDeleted");

  const resolved = new Map<string, Types.ObjectId>();
  const pending: {
    item: SeedItem;
    index: number;
    userId: Types.ObjectId;
    newUser?: Record<string, unknown>;
  }[] = [];
  for (const [index, item] of seedData.entries()) {
    const { doctor } = item;
    const user = usersByEmail.get(doctor.email);
    const matches = doctors.filter(
      profile =>
        profile.email === doctor.email ||
        (user && String(profile.userId) === String(user._id)),
    );
    const existingDoctor = matches[0];

    /*
     * Prevent duplicate patients when seed runs again.
     */
    if (existingDoctor) {
      if (
        matches.length !== 1 ||
        existingDoctor.isDeleted ||
        existingDoctor.email !== doctor.email ||
        !user ||
        user.role !== USER_ROLE.DOCTOR ||
        user.isDeleted ||
        String(existingDoctor.userId) !== String(user._id)
      )
        throw new ApiError(
          httpStatus.CONFLICT,
          `Ambiguous doctor association at seed row ${index + 1}`,
        );
      resolved.set(doctor.email, existingDoctor._id as Types.ObjectId);
      report.doctorsReused++;
      continue;
    }

    const medicalRegistrationNo = registrationNumber(index);
    if (
      doctors.some(
        profile => profile.medicalRegistrationNo === medicalRegistrationNo,
      )
    ) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Seed registration conflict at row ${index + 1}`,
      );
    }

    /*
     * Create or find doctor user.
     */
    if (user && (user.role !== USER_ROLE.DOCTOR || user.isDeleted)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Seed account conflict at row ${index + 1}`,
      );
    }
    const userId = user ? (user._id as Types.ObjectId) : new Types.ObjectId();
    const account = createAccountZodSchema.parse({
      email: doctor.email,
      password: doctor.password,
      role: USER_ROLE.DOCTOR,
    });
    pending.push({
      item,
      index,
      userId,
      newUser: user
        ? undefined
        : {
            ...account,
            _id: userId,
            password: await bcrypt.hash(
              account.password,
              env.BCRYPT_SALT_ROUNDS,
            ),
          },
    });
  }

  // Five profiles plus up to five accounts = at most ten document writes.
  const doctorBatchSize = Math.floor(SEED_BATCH_SIZE / 2);
  for (let offset = 0; offset < pending.length; offset += doctorBatchSize) {
    const batch = pending.slice(offset, offset + doctorBatchSize);
    const profiles = batch.map(({ item: { doctor }, index, userId }) => ({
      _id: new Types.ObjectId(),
      userId,
      createdBy: adminUser._id,
      name: doctor.name,
      medicalRegistrationNo: registrationNumber(index),
      email: doctor.email,
      phone: doctor.phone,
      hospital: doctor.hospital,
      specialization: doctor.specialization,
    }));
    /*
     * Create doctor profile after checking that its email does not exist.
     */
    await runBatch(async () => {
      const accounts = batch.flatMap(entry =>
        entry.newUser ? [entry.newUser] : [],
      );
      if (accounts.length)
        await User.insertMany(accounts, { session, ordered: true });
      await Doctor.insertMany(profiles, { session, ordered: true });
    });
    profiles.forEach(profile => resolved.set(profile.email, profile._id));
    report.doctorsCreated += profiles.length;
  }

  const existingPatients = await Patient.find({
    doctorId: { $in: [...resolved.values()] },
  })
    .select("doctorId name phone isDeleted")
    .lean();
  const patientsByDoctor = new Map<string, PatientIdentity[]>();
  for (const patient of existingPatients) {
    const key = String(patient.doctorId);
    const group = patientsByDoctor.get(key) ?? [];
    group.push(patient);
    patientsByDoctor.set(key, group);
  }

  const missing = [];
  for (const { doctor, patients } of seedData) {
    const doctorId = resolved.get(doctor.email)!;
    const existing = indexPatientIdentities(
      patientsByDoctor.get(String(doctorId)) ?? [],
    );
    const seedIdentities = indexPatientIdentities(patients);
    for (const patient of patients) {
      const name = normalizeName(patient.name);
      const phone = normalizePhone(patient.phone);
      const key = JSON.stringify([name, phone]);
      const matches = existing.exact.get(key) ?? [];
      const duplicateSeed = (seedIdentities.exact.get(key)?.length ?? 0) > 1;
      if (!duplicateSeed && matches.length === 1 && !matches[0].isDeleted) {
        report.patientsSkipped++;
      } else if (
        duplicateSeed ||
        matches.length > 0 ||
        existing.incomplete ||
        !name ||
        !/^\+?\d{6,20}$/.test(phone) ||
        existing.names.has(name) ||
        existing.phones.has(phone) ||
        (seedIdentities.names.get(name) ?? 0) > 1 ||
        (seedIdentities.phones.get(phone) ?? 0) > 1
      ) {
        report.patientsAmbiguous++;
      } else {
        /*
         * Dynamically replace/set doctorId using
         * the actual MongoDB doctor profile ID.
         */
        missing.push({
          ...patient,
          doctorId,
          _id: new Types.ObjectId(),
          lastVisitAt: new Date(patient.lastVisitAt),
          followUpDate: new Date(patient.followUpDate),
        });
      }
    }
  }
  if (report.patientsAmbiguous) {
    console.log(
      `Ambiguous patient matches skipped: ${report.patientsAmbiguous}`,
    );
  }
  for (let offset = 0; offset < missing.length; offset += SEED_BATCH_SIZE) {
    const batch = missing.slice(offset, offset + SEED_BATCH_SIZE);
    await runBatch(async () => {
      await Patient.insertMany(batch, { session, ordered: true });
    });
    report.patientsInserted += batch.length;
  }
}

export async function seedDatabase(): Promise<void> {
  const startedAt = Date.now();
  const report: SeedReport = {
    doctorsFound: 0,
    doctorsReused: 0,
    doctorsCreated: 0,
    patientsSkipped: 0,
    patientsInserted: 0,
    patientsAmbiguous: 0,
    failedBatches: 0,
  };
  let session: ClientSession | undefined;
  try {
    const seedData = getSeedData();
    report.doctorsFound = seedData.length;
    if (
      new Set(seedData.map(item => item.doctor.email)).size !== seedData.length
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Duplicate doctor emails in seed data",
      );
    }
    // MongoDB can implicitly create collections on insert. Require pre-existing ones.
    const db = User.db.db;
    if (!db) throw new Error("Database is not connected");
    const collections = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map(
        entry => entry.name,
      ),
    );
    if (
      [User, Admin, Doctor, Patient].some(
        model => !collections.has(model.collection.collectionName),
      )
    ) {
      throw new Error(
        "Required collections must already exist; seed cannot create database structure",
      );
    }
    session = await User.db.startSession();
    const activeSession = session;
    const runBatch = createBatchRunner(activeSession, report);
    const adminUser = await runBatch(() => seedAdmin(activeSession));
    await seedDoctorsAndPatients(
      seedData,
      adminUser,
      activeSession,
      runBatch,
      report,
    );
  } finally {
    if (session) await session.endSession();
    console.log("Seed summary:", {
      ...report,
      durationMs: Date.now() - startedAt,
    });
  }
}

async function main(): Promise<void> {
  try {
    // Model-level options override the connection's automatic DDL settings.
    // Set them before connecting; this entry point must never create collections/indexes.
    for (const model of [User, Admin, Doctor, Patient]) {
      model.schema.set("autoIndex", false);
      model.schema.set("autoCreate", false);
    }
    await connectDatabase();

    await seedDatabase();

    console.log("Database seed completed");
  } catch (error) {
    console.error(
      "Database seed failed; inspect the seed summary. Error type:",
      error instanceof Error ? error.name : "UnknownError",
    );

    process.exitCode = 1;
  } finally {
    try {
      await disconnectDatabase();
    } catch (error) {
      console.error(
        "Failed to close database connection. Error type:",
        error instanceof Error ? error.name : "UnknownError",
      );

      process.exitCode = 1;
    }
  }
}

if (require.main === module) {
  void main();
}
