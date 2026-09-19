import type { Request, Response } from "express";
import * as categoryService from "./service.js";
import ApiResponse from "../../comman/utils/api.response.js";
import type { SearchCategoryInput } from "./dto/searchCategory.dto.js";

export const createCategory = async (req: Request, res: Response) => {
  const categories = await categoryService.createCategory(req.body);
  return ApiResponse.created(res, "Category created successfully", categories);
};

export const searchCategory = async (req: Request, res: Response) => {
  const query = req.validatedQuery as SearchCategoryInput;
  const categories = await categoryService.searchCategory(query);
  return ApiResponse.ok(res, "Category searched successfully", categories);
};
