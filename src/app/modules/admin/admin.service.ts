import httpStatus from "http-status";
import { FilterQuery, Types } from "mongoose";
import { AbstractService } from "../../core/abstract/AbstractService";
import { ApiError } from "../../errors/ApiError";
import { IUserRef } from "../../interfaces/user.ref";
import { USER_ROLE } from "../../../global/enums/users";
import { User } from "../user/user.model";
import { UserService } from "../user/user.service";
import { Admin, IAdminDocument } from "./admin.model";
import {
  CreateAdminDto,
  UpdateAdminDto,
  ListAdminsQuery,
} from "./admin.validation";
const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export class AdminService extends AbstractService {
  constructor(private readonly userService: UserService) {
    super();
  }
  private validateId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid admin id");
  }

  async create(payload: CreateAdminDto, authUser: IUserRef) {
    const session = await Admin.db.startSession();
    try {
      return await session.withTransaction(async () => {
        const user = await this.userService.createAccount(
          {
            email: payload.email,
            password: payload.password,
            role: USER_ROLE.ADMIN,
          },
          session,
        );
        const [admin] = await Admin.create(
          [
            {
              userId: user._id,
              name: payload.name,
              phoneNumber: payload.phoneNumber,
            },
          ],
          { session },
        );
        return admin;
      });
    } finally {
      await session.endSession();
    }
  }
  async findOne(id: string, authUser: IUserRef) {
    this.validateId(id);
    const filter = { _id: id, isDeleted: false };
    const result = await Admin.findOne(filter)
      .populate({
        path: "userId",
        match: { isDeleted: false },
        select: "email role isActive",
      })
      .lean();
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
    return result;
  }
  private buildFilter(query: ListAdminsQuery): FilterQuery<IAdminDocument> {
    const filter: FilterQuery<IAdminDocument> = { isDeleted: false };

    if (query.searchTerm)
      filter.$or = ["name", "phoneNumber"].map(field => ({
        [field]: { $regex: escapeRegex(query.searchTerm!), $options: "i" },
      }));
    return filter;
  }
  async findAll(query: ListAdminsQuery, authUser: IUserRef) {
    const { page, limit, skip, sortBy, sortOrder } =
      this.calculatePagination(query);
    const filter = this.buildFilter(query);

    const sort = this.parseSort(`${sortBy}:${sortOrder}`);
    const [data, total] = await Promise.all([
      Admin.find(filter)
        .sort({ ...sort, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Admin.countDocuments(filter),
    ]);
    return { data, meta: { page, limit, total } };
  }
  async update(id: string, payload: UpdateAdminDto, authUser: IUserRef) {
    this.validateId(id);
    const filter = { _id: id, isDeleted: false };

    const result = await Admin.findOneAndUpdate(
      filter,
      { $set: payload },
      { new: true, runValidators: true },
    );
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
    return result;
  }
  async softDelete(id: string, authUser: IUserRef) {
    this.validateId(id);
    const filter = { _id: id, isDeleted: false };
    const result = await Admin.findOneAndUpdate(
      filter,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
    return result;
  }
  async restore(id: string, authUser: IUserRef) {
    this.validateId(id);
    const existing = await Admin.findOne({ _id: id, isDeleted: true })
      .select("userId")
      .lean();
    if (!existing)
      throw new ApiError(httpStatus.NOT_FOUND, "Deleted admin not found");
    if (
      !(await User.exists({
        _id: existing.userId,
        role: USER_ROLE.ADMIN,
        isDeleted: false,
        isActive: true,
      }))
    )
      throw new ApiError(httpStatus.CONFLICT, "Active admin account required");
    const result = await Admin.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true, runValidators: true },
    );
    if (!result)
      throw new ApiError(httpStatus.NOT_FOUND, "Deleted admin not found");
    return result;
  }
}
