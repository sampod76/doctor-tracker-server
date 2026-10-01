import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import type { JwtPayload } from "jsonwebtoken";
import { PipelineStage, Types } from "mongoose";
import { USER_ROLE } from "../../../global/enums/users";
import {
  accessTokenExpiresIn,
  accessTokenSecret,
  jwtHelpers,
  refreshTokenExpiresIn,
  refreshTokenSecret,
} from "../../../helper/jwtHelpers";
import { env } from "../../config/env";
import { AbstractService } from "../../core/abstract/AbstractService";
import { ApiError } from "../../errors/ApiError";
import { IUserRef } from "../../interfaces/user.ref";
import { User } from "../user/user.model";
import { ChangePasswordDto, LoginDto } from "./authentication.validation";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthResult = AuthTokens & {
  user: IUserRef;
};

const issueJwtTokens = (payload: Record<string, unknown>): AuthTokens => {
  const accessToken = jwtHelpers.createToken(
    payload,
    accessTokenSecret,
    accessTokenExpiresIn,
  );

  const refreshToken = jwtHelpers.createToken(
    payload,
    refreshTokenSecret,
    refreshTokenExpiresIn,
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenExpiresIn,
  };
};

export class AuthenticationService extends AbstractService {
  constructor() {
    super();
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await User.findOne({
      email: dto.email,
      isDeleted: false,
    })
      .select("+password")
      .exec();

    if (!user || !user.isActive) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
    };

    return {
      ...issueJwtTokens(payload),
      user: {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let decoded: JwtPayload;
    try {
      decoded = jwtHelpers.verifyToken(refreshToken, refreshTokenSecret);
    } catch {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    if (!decoded.userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Malformed refresh token");
    }

    const user = await User.findOne({
      _id: decoded.userId,
      isDeleted: false,
    }).exec();

    if (!user || !user.isActive) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
    };

    return {
      ...issueJwtTokens(payload),
      user: {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  }

  async profile(authUser: IUserRef) {
    const userId = new Types.ObjectId(authUser.userId);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: userId,
          isDeleted: false,
        },
      },
    ];

    if (authUser.role === USER_ROLE.DOCTOR) {
      pipeline.push(
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "userId",
            as: "profile",
          },
        },
        {
          $unwind: {
            path: "$profile",
            preserveNullAndEmptyArrays: true,
          },
        },
      );
    }

    if (authUser.role === USER_ROLE.ADMIN) {
      pipeline.push(
        {
          $lookup: {
            from: "admins",
            localField: "_id",
            foreignField: "userId",
            as: "profile",
          },
        },
        {
          $unwind: {
            path: "$profile",
            preserveNullAndEmptyArrays: true,
          },
        },
      );
    }

    pipeline.push({
      $project: {
        password: 0,
        isDeleted: 0,
        deletedAt: 0,
        __v: 0,
      },
    });

    const [user] = await User.aggregate(pipeline);

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return {
      user: {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.profile ?? null,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await User.findById(userId).select("+password").exec();
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Current password is incorrect",
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, env.BCRYPT_SALT_ROUNDS);
    await user.save();

    return { message: "Password changed. Please log in again." };
  }
}
