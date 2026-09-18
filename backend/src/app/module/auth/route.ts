import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../../comman/middleware/validate.middleware.js";
import registerDto from "./dto/register.dto.js";
import signInDto from "./dto/signIn.dto.js";
import sendOtpForEmailVerificationDto from "./dto/sendOtpForEmailVerification.dto.js";
import verifyEmailWithOtpDto from "./dto/verifyEmailWithOtp.dto.js";
import { catchAsyncErrors } from "../../comman/middleware/catchAsyncError.js";

const router: Router = Router();

router.post(
  "/register",
  validate(registerDto),
  catchAsyncErrors(controller.register),
);
router.post(
  "/signIn",
  validate(signInDto),
  catchAsyncErrors(controller.signIn),
);
router.post(
  "/verifyEmailWithOtp",
  validate(verifyEmailWithOtpDto),
  catchAsyncErrors(controller.verifyEmailWithOtp),
);
router.post(
  "/sendOtpForEmailVerification",
  validate(sendOtpForEmailVerificationDto),
  catchAsyncErrors(controller.sendOtpForEmailVerification),
);

export default router;
