import { USER_ROLE } from "../../global/enums/users";

export interface IUserRef {
  userId: string;
  email: string;
  role: USER_ROLE;
}
