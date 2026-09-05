import type { Request, Response } from "express";
import * as authService from "./service.js";
import ApiResponse from "../../comman/utils/api.response.js";

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  return ApiResponse.created(res, "User registered successfully", user);
};

export const signIn = async (req: Request, res: Response) => {
  const user = await authService.signIn(req.body);
  return ApiResponse.ok(res, "User signed in successfully", user);
};

export const verifyEmailWithOtp = async (req: Request, res: Response) => {
  await authService.verifyEmailWithOtp(req.body);
  return ApiResponse.ok(res, "Email verified successfully", {});
};

export const sendOtpForEmailVerification = async (
  req: Request,
  res: Response,
) => {
  await authService.sendOtpForEmailVerification(req.body);
  return ApiResponse.ok(res, "OTP sent successfully", {});
};
