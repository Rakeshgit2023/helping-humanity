import type { Request, Response } from "express";
import * as authService from "./service.js";
import ApiResponse from "../../comman/utils/api.response.js";
import type { RegisterResponse } from "./dto/register.dto.js";
import type { SignInResponseInput } from "./dto/signIn.dto.js";
import type { verifyEmailWithOtpResponseInput } from "./dto/verifyEmailWithOtp.dto.js";
import type { SendOtpForEmailVerificationResponseInput } from "./dto/sendOtpForEmailVerification.dto.js";
import type {
  RefreshAccessTokenInput,
  RefreshAccessTokenResponseInput,
} from "./dto/refreshAccessToken.dto.js";

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  const response: RegisterResponse = {
    message: "Registration successful. Please verify your email.",
    user,
  };
  return ApiResponse.created(res, response.message, response.user);
};

export const signIn = async (req: Request, res: Response) => {
  const userData = await authService.signIn(
    req.body,
    req.get("user-agent") || "",
  );
  const response: SignInResponseInput = {
    message: "User signed in successfully",
    data: userData,
  };
  return ApiResponse.ok(res, response.message, response.data);
};

export const verifyEmailWithOtp = async (req: Request, res: Response) => {
  const user = await authService.verifyEmailWithOtp(req.body);
  const response: verifyEmailWithOtpResponseInput = {
    message: "Email verified successfully",
    data: user,
  };
  return ApiResponse.ok(res, response.message, response.data);
};

export const sendOtpForEmailVerification = async (
  req: Request,
  res: Response,
) => {
  await authService.sendOtpForEmailVerification(req.body);
  const response: SendOtpForEmailVerificationResponseInput = {
    message: "OTP sent successfully. Please check your email.",
    data: null,
  };
  return ApiResponse.ok(res, response.message);
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  const query = req.validatedQuery as RefreshAccessTokenInput;
  const userData = await authService.refreshAccessToken(
    query,
    req.get("user-agent") || "",
  );

  const response: RefreshAccessTokenResponseInput = {
    message: "Access token refreshed successfully",
    data: userData,
  };
  return ApiResponse.ok(res, response.message, response.data);
};

export const logout = async (req: Request, res: Response) => {
  await authService.logout(req.user);
  return ApiResponse.ok(res, "User logout successful");
};
