import type { Request, Response } from "express";
import * as categoryService from "./service.js";
import ApiResponse from "../../comman/utils/api.response.js";
import type {
  SearchCategoryInput,
  SearchCategoryResponseInput,
} from "./dto/searchCategory.dto.js";
import type { CreateCategoryResponseInput } from "./dto/createCategory.dto.js";
import type { FetchCategoriesResponseInput } from "./dto/fetchCategory.dto.js";

export const fetchCategories = async (req: Request, res: Response) => {
  const categories = await categoryService.fetchCategories();
  const response: FetchCategoriesResponseInput = {
    message: "Categories fetched successfully",
    data: categories,
  };
  return ApiResponse.ok(res, response.message, response.data);
};

export const createCategory = async (req: Request, res: Response) => {
  const categories = await categoryService.createCategory(req.body);
  const response: CreateCategoryResponseInput = {
    message: "Category created successfully",
    data: categories,
  };

  return ApiResponse.created(res, response.message, response.data);
};

export const searchCategory = async (req: Request, res: Response) => {
  const query = req.validatedQuery as SearchCategoryInput;
  const categories = await categoryService.searchCategory(query);
  const response: SearchCategoryResponseInput = {
    message: "Categories fetched successfully",
    data: categories,
  };

  return ApiResponse.ok(res, response.message, response.data);
};
