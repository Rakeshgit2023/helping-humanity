import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../../comman/middleware/validate.middleware.js";
import registerDto from "./dto/register.dto.js";
import signInDto from "./dto/signIn.dto.js";
import sendOtpForEmailVerificationDto from "./dto/sendOtpForEmailVerification.dto.js";
import verifyEmailWithOtpDto from "./dto/verifyEmailWithOtp.dto.js";

const router: Router = Router();

router.post("/register", validate(registerDto), controller.register);
router.post("/signIn", validate(signInDto), controller.signIn);
router.post(
  "/verifyEmailWithOtp",
  validate(verifyEmailWithOtpDto),
  controller.verifyEmailWithOtp,
);
router.post(
  "/sendOtpForEmailVerification",
  validate(sendOtpForEmailVerificationDto),
  controller.sendOtpForEmailVerification,
);

export default router;
