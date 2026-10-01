import { NextFunction, Request, Response } from "express";
import { RequestToFileDecodeAddBodyHandle } from "../../../helper/requestToFilesHandle";
import ApiError from "../../errors/ApiError";
import catchAsync from "../../share/catchAsync";

type IParseBodyDate = {
  isFile?: boolean;
  required_file_fields?: string[];
};

const parseBodyData = ({
  isFile = true,
  required_file_fields,
}: IParseBodyDate) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (req?.body?.data) {
      req.body = JSON.parse(req.body.data);
    }

    if (isFile) {
      await RequestToFileDecodeAddBodyHandle(req);
    }

    const messingRequiredField: string[] = [];
    required_file_fields?.forEach(field => {
      if (!req.body[field]) {
        messingRequiredField.push(field);
      }
    });

    if (messingRequiredField.length) {
      throw new ApiError(
        404,
        `${messingRequiredField.join(", ")} this field is required`,
      );
    }

    next();
  });
};

export default parseBodyData;
