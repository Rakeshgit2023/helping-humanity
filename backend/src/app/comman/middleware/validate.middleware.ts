import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error.js";
import type BaseDto from "../dto/base.dto.js";

type ValidateSource = "body" | "query";

export const validate = (dto: BaseDto, source: ValidateSource = "body") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { errors, value } = await dto.validate(req[source]);

    if (errors) {
      throw ApiError.badRequest(errors.join("; "));
    }

    if (source === "body") {
      req.body = value;
    } else if (source === "query") {
      req.validatedQuery = value;
    }

    next();
  };
};
