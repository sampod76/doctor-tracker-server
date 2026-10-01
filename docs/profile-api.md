# Admin, Doctor, and Patient APIs

All paths below are relative to `/api/v1`. Requests require a Bearer access token. Responses use the existing `{ success, statusCode, message, meta, data }` envelope.

| Resource | Create         | List          | Detail            | Update              | Soft delete          | Restore                     |
| -------- | -------------- | ------------- | ----------------- | ------------------- | -------------------- | --------------------------- |
| Admin    | POST /admins   | GET /admins   | GET /admins/:id   | PATCH /admins/:id   | DELETE /admins/:id   | PATCH /admins/:id/restore   |
| Doctor   | POST /doctors  | GET /doctors  | GET /doctors/:id  | PATCH /doctors/:id  | DELETE /doctors/:id  | PATCH /doctors/:id/restore  |
| Patient  | POST /patients | GET /patients | GET /patients/:id | PATCH /patients/:id | DELETE /patients/:id | PATCH /patients/:id/restore |

Admin and Doctor endpoints require the ADMIN role. Patient CRUD and statistics accept ADMIN and DOCTOR; restore requires ADMIN. Doctors can create, list, read, update, delete, and obtain statistics only for their own assigned patients. The service resolves their Doctor profile using the authenticated User ID. A doctor cannot reassign patients to another doctor. An admin can reassign patients to an active doctor.

## Account and profile creation

Create a Doctor or Admin account and profile in one request to `POST /doctors` or `POST /admins`. Each service uses `UserService.createAccount()` for email uniqueness, password hashing, and account creation, then writes the profile in the same MongoDB transaction. Failed profile creation rolls back the account. MongoDB must run as a replica set or sharded deployment; standalone MongoDB does not support this workflow. The bundled `docker-compose.yml` currently starts standalone MongoDB and needs replica-set configuration or a transaction-capable external database. `POST /users` is no longer exposed. The initial Admin must be provisioned through trusted internal/bootstrap code using `createAccount()`; subsequent Admins can be created through the authenticated Admin endpoint.

Admin creation requires `email`, `password`, `name`, and `phoneNumber`. Doctor creation requires `email`, `password`, `name`, `specialization`, `hospital`, and `phone`; `isActive` is optional. Email is normalized and reserved even for soft-deleted accounts. Passwords follow the existing 8–128 character constraints and are stored only as hashes on User. Clients cannot supply `userId`, `createdBy`, or `role`. The backend forces ADMIN/DOCTOR roles and derives profile `userId` from the newly created account. Doctor `email` comes from that account, and `createdBy` comes from the authenticated admin. Neither `userId`, `createdBy`, nor Doctor `email` can be changed by profile updates. Authentication account changes remain in the User API; the Doctor email is a snapshot from profile creation. Profiles retain their unique User references; restore an existing deleted profile rather than recreating its account.

Example `POST /doctors` body:

```json
{
  "email": "doctor@example.com",
  "password": "StrongPassword123",
  "name": "Dr. John Doe",
  "specialization": "CARDIOLOGY",
  "hospital": "Square Hospital",
  "phone": "01700000000"
}
```

Patient creation requires `doctorId`, `name`, `phoneNumber`, `age`, `gender`, and `patientComplaint`. Optional fields are `address`, `doctorAdvice`, `notes`, `treatmentStatus`, `lastVisitAt`, and `followUpDate`. Treatment status defaults to ACTIVE. Dates must be full ISO 8601 timestamps with a timezone, such as `2026-10-01T09:00:00+06:00`; nullable date fields can be cleared with `null` on update.

Updates are partial and reject unknown/protected fields and empty bodies. Deletion sets `isDeleted` and `deletedAt`, retaining the document and its relationships. Profile deletion does not delete or deactivate the separate authentication account. Deleted or inactive Doctor profiles cannot access patient endpoints. Restoring a profile requires an active matching account; restoring a patient requires an active assigned Doctor profile.

## Lists and statistics

All lists support `page`, `limit` (maximum 100), `sortBy`, `sortOrder` (`asc` or `desc`), and `searchTerm`. Defaults are page 1, limit 10, and createdAt descending. Metadata is `{ page, limit, total }`. Sort fields are allowlisted; search is escaped literal text. Normal lists, details, and statistics exclude deleted records.

| Resource | Search fields                       | Filters                                                      | Additional sort fields               |
| -------- | ----------------------------------- | ------------------------------------------------------------ | ------------------------------------ |
| Admin    | name, phoneNumber                   | —                                                            | name                                 |
| Doctor   | name, email, phone, hospital        | specialization, hospital, isActive                           | name, specialization, hospital       |
| Patient  | name, phoneNumber, patientComplaint | doctorId, gender, treatmentStatus, followUpDate, lastVisitAt | name, followUpDate, lastVisitAt, age |

Every resource also supports sorting by createdAt and updatedAt. `isActive` query values must be the strings `true` or `false`. Date filters match an exact timestamp. To list a doctor's patients, use `GET /patients?doctorId=<Doctor profile ID>`.

`GET /doctors/statistics` returns total, active, inactive, and counts by specialization.

`GET /patients/statistics` returns total, active, underObservation, recovered, upcomingFollowUps, and counts by gender and treatment status. Optional `doctorId` scopes statistics to one Doctor profile. Authenticated doctors are always scoped to their own profile and cannot request another doctor's statistics. Upcoming follow-ups are nondeleted patients with followUpDate at or after the current instant.

Detail endpoints populate only selected account/doctor fields. Passwords are omitted from responses and never stored on Doctor, Admin, or Patient.

## Verification

Run `npm run tsc:check`, `npm run lint:check`, and `npm test -- --runInBand`. Profile integration tests use mongodb-memory-server and an isolated temporary replica set, including real transactions, Mongoose indexes, and HTTP authorization. They verify that failed Doctor/Admin creation leaves no orphaned User. On the first run, mongodb-memory-server may download a MongoDB binary. Production disables automatic index creation; deploy the indexes declared in the model schemas through the normal database deployment process.
