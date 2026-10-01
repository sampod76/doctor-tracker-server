// jest.setup.js — set env defaults before the suite imports `env.ts`.
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-must-be-long-enough";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "test-jwt-refresh-secret-must-be-long-enough";
process.env.MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/doctorTracker_test";
