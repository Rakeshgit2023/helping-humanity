import type { Request, Response } from "express";
import * as requestService from "./service.js";
import ApiResponse from "../../comman/utils/api.response.js";

export const createRequest = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const request = await requestService.createRequest(req.body, req.user, files);
  return ApiResponse.ok(res, "Request created successfully", request);
};
