import type { Request, Response } from "express";
import * as requestService from "./service.js";
import ApiResponse from "../../comman/utils/api.response.js";

export const createRequest = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  console.log("Files received:", files);
  console.log(req.body.categoryId); // Log the files to check if they are received correctly
  const request = await requestService.createRequest(req.body, req.user, files);
  return ApiResponse.ok(res, "Request created successfully", request);
};

export const volunteersForRequest = async (req: Request, res: Response) => {
  const params = req.validatedParams as RequestIdParamInput;
  const volunteers = await requestService.volunteersForRequest(
    params,
    req.user,
  );
  return ApiResponse.ok(res, "Volunteers fetched successfully", volunteers);
};

export const acceptRequest = async (req: Request, res: Response) => {
  const params = req.validatedParams as AcceptRequestBodyInput;
  const result = await requestService.acceptRequest(params, req.user);
  return ApiResponse.ok(res, "Request accepted successfully", result);
};

export const proceedWithAccepted = async (req: Request, res: Response) => {
  const params = req.validatedParams as RequestIdParamInput;
  const result = await requestService.proceedWithAccepted(params, req.user);
  return ApiResponse.ok(
    res,
    "Request will proceed with accepted volunteers",
    result,
  );
};

export const startRequest = async (req: Request, res: Response) => {
  const params = req.validatedParams as RequestIdParamInput;
  const result = await requestService.startRequest(params, req.user);
  return ApiResponse.ok(res, "Request started successfully", result);
};

export const declineRequest = async (req: Request, res: Response) => {
  const params = req.validatedParams as RequestIdParamInput;
  const result = await requestService.declineRequest(params, req.user);
  return ApiResponse.ok(res, "Request declined successfully", result);
};

export const completeRequest = async (req: Request, res: Response) => {
  const params = req.validatedParams as RequestIdParamInput;
  const result = await requestService.completeRequest(params, req.user);
  return ApiResponse.ok(res, "Request completed successfully", result);
};

export const cancelRequest = async (req: Request, res: Response) => {
  const params = req.validatedParams as RequestIdParamInput;
  const result = await requestService.cancelRequest(params, req.user);
  return ApiResponse.ok(res, "Request canceled successfully", result);
};
