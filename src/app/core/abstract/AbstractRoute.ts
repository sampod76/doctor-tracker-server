import express, { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware";

import validateRequestZod from "../../middlewares/validateRequestZod";

import { USER_ROLE } from "../../../global/enums/users";

export abstract class AbstractRoute {
  public readonly router: Router = express.Router();

  protected readonly authMiddleware = authMiddleware;

  protected readonly validateRequestZod = validateRequestZod;

  protected readonly USER_ROLE = USER_ROLE;

  protected init(): void {
    //
  }
}
