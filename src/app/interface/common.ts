import { JwtPayload } from "jsonwebtoken";
import { IUserRef } from "../interfaces/user.ref";
import { IGenericErrorMessage } from "./error";

export interface IJwtAuthUser extends JwtPayload {
  role: IUserRef["role"];
  userId: string;
  email?: string;
}

export type IGenericResponse<T> = {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: T;
};

export type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: Array<IGenericErrorMessage>;
};

export type ServiceContext = {
  user?: IUserRef;
  timeZone: string;
};