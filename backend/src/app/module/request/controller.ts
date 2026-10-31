import type { Request, Response } from "express";
import * as requestService from "./service.js";
import ApiResponse from "../../comman/utils/api.response.js";
import type { VolunteersForRequestInput } from "./dto/volunteersForRequest.dto.js";

export const createRequest = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  console.log("Files received:", files); 
  console.log(req.body.categoryId);// Log the files to check if they are received correctly
  const request = await requestService.createRequest(req.body, req.user, files);
  return ApiResponse.ok(res, "Request created successfully", request);
};

export const volunteersForRequest = async (req: Request, res: Response) => {
  const volunteers = await requestService.volunteersForRequest(
    req.body,
    req.user,
  );
  return ApiResponse.ok(res, "Volunteers fetched successfully", volunteers);
};
