import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error.js";
import type BaseDto from "../dto/base.dto.js";
import { requireFiles } from "./upload.middleware.js";

type ValidateSource = "body" | "query";

export const validate = (
  dto: BaseDto,
  source: ValidateSource = "body",
  isFileRequired: boolean = false,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { errors, value } = await dto.validate(req[source]);
    const allErrors: string[] = errors ? [...errors] : [];

    if (isFileRequired) {
      const fileError = requireFiles(req);
      if (fileError) allErrors.push(fileError);
    }

    if (allErrors.length) {
      throw ApiError.badRequest(allErrors.join("; "));
    }

    if (source === "body") {
      req.body = value;
    } else if (source === "query") {
      req.validatedQuery = value;
    }

    next();
  };
};
