import type { Request, Response } from "express";
import * as interestService from "./service.js";
import ApiResponse from "../../comman/utils/api.response.js";
import type { SearchInput } from "./dto/search.dto.js";

export const create = async (req: Request, res: Response) => {
  await interestService.create(req.body);
  ApiResponse.created(res, "Interest created successfully", {});
};

export const search = async (
  req: Request<{}, {}, {}, SearchInput>,
  res: Response,
) => {
  const query = req.validatedQuery as SearchInput;

  const interests = await interestService.search(query);

  ApiResponse.ok(res, "Interests fetched successfully", interests);
};
