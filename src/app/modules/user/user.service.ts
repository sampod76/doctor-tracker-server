import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import {
  ClientSession,
  Document,
  FilterQuery,
  PipelineStage,
  Types,
} from "mongoose";
import { env } from "../../config/env";
import { AbstractService } from "../../core/abstract/AbstractService";
import { ApiError } from "../../errors/ApiError";

import { USER_ROLE } from "../../../global/enums/users";
import { authCache } from "../../../helper/authCache";
import { IUserDocument, User } from "./user.model";
import {
  CreateAccountDto,
  createAccountZodSchema,
  ListUsersQuery,
  UpdateUserDto,
} from "./user.validation";
import { IPaginationOptions } from "../../interface/pagination";
import { IUserRef } from "../../interfaces/user.ref";
import { USER_SEARCHABLE_FIELDS } from "./user.constant";

const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class UserService extends AbstractService {
  constructor() {
    super();
  }

  async createAccount(
    payload: CreateAccountDto,
    session?: ClientSession,
  ): Promise<IUserDocument> {
    const account = createAccountZodSchema.parse(payload);
    const email = account.email.trim().toLowerCase();
    const existing = await User.findOne({
      email,
    }).session(session ?? null);
    if (existing) {
      throw new ApiError(httpStatus.CONFLICT, "Email already in use");
    }

    const hashed = await bcrypt.hash(account.password, env.BCRYPT_SALT_ROUNDS);

    const [user] = await User.create(
      [
        {
          email,
          password: hashed,
          role: account.role,
        },
      ],
      { session },
    );
    return user;
  }

  async findOne(id: string): Promise<IUserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user id");
    }
    const user = await User.findById(id);
    if (!user || user.isDeleted) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    return user;
  }

  private buildFilter(query: ListUsersQuery): FilterQuery<IUserDocument> {
    const { searchTerm, ...filtersData } = query;
    const andConditions: FilterQuery<IUserDocument>[] = [{ isDeleted: false }];
    if (searchTerm) {
      andConditions.push({
        $or: USER_SEARCHABLE_FIELDS.map(field => ({
          [field]: { $regex: escapeRegex(searchTerm), $options: "i" },
        })),
      });
    }
    if (filtersData.role !== undefined) {
      andConditions.push({ role: filtersData.role });
    }
    if (filtersData.isActive !== undefined) {
      andConditions.push({ isActive: filtersData.isActive });
    }
    if (filtersData.ids) {
      const ids = filtersData.ids
        .split(",")
        .map(id => id.trim())
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));
      andConditions.push({ _id: { $in: ids } });
    }
    return andConditions.length > 0 ? { $and: andConditions } : {};
  }

  async findAll(
    filters: ListUsersQuery,
    paginationOptions: IPaginationOptions = filters,
    authuser?: IUserRef,
  ) {
    const whereConditions = this.buildFilter(filters);
    //****************pagination start **************/
    const { page, limit, skip, sortBy, sortOrder } =
      this.calculatePagination(paginationOptions);
    const sortConditions = this.parseSort(`${sortBy}:${sortOrder}`);
    //****************pagination end ***************/
    const pipeline: PipelineStage[] = [
      { $match: whereConditions },
      {
        $facet: {
          data: [
            { $sort: { ...sortConditions, _id: sortConditions._id ?? 1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { password: 0 } },
          ],
          countDocuments: [{ $count: "totalData" }],
        },
      },
    ];
    const pipelineResult = await User.aggregate(pipeline);
    const data = pipelineResult[0]?.data ?? [];
    const total = pipelineResult[0]?.countDocuments[0]?.totalData ?? 0;

    return {
      data,
      meta: { page, limit, total },
    };
  }

  async findByEmail(
    email: string,
    options: { withPassword?: boolean } = {},
  ): Promise<IUserDocument | null> {
    const query = User.findOne({ email: email.toLowerCase() });
    if (options.withPassword) {
      query.select("+password");
    }
    return query.exec();
  }

  async update(id: string, payload: UpdateUserDto): Promise<IUserDocument> {
    await this.findOne(id);

    const update: Partial<IUserDocument> & { password?: string } = {};
    if (payload.email !== undefined) update.email = payload.email;
    if (payload.role !== undefined) update.role = payload.role;
    if (payload.isActive !== undefined) update.isActive = payload.isActive;
    if (payload.password !== undefined) {
      update.password = await bcrypt.hash(
        payload.password,
        env.BCRYPT_SALT_ROUNDS,
      );
    }

    const updated = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    // Drop any cached auth-user payload so role/email/isActive changes are
    // reflected on the next request instead of waiting for TTL expiry.
    authCache.invalidateAuthUserCache(updated._id.toString());
    return updated;
  }

  async softDelete(id: string): Promise<IUserDocument> {
    const user = await this.findOne(id);
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    // Soft-deleted users must no longer authenticate; clear their cached
    // auth-user entry so the middleware immediately re-evaluates them.
    authCache.invalidateAuthUserCache(user._id.toString());
    return user;
  }

  async restore(id: string): Promise<IUserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user id");
    }
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();
    // The restored user may now authenticate again; clear any stale cache.
    authCache.invalidateAuthUserCache(user._id.toString());
    return user;
  }

  async findByRole(role: USER_ROLE): Promise<IUserDocument[]> {
    return User.find({ role, isDeleted: false }).exec();
  }
}
