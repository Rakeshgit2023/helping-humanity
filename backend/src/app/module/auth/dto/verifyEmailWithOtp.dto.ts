import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

const verifyEmailWithOtpSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),

  otp: z
    .string({ error: "OTP is required" })
    .min(6, "OTP must be 6 digits long")
    .max(6, "OTP must be 6 digits long"),
});

export type VerifyEmailWithOtpInput = z.infer<typeof verifyEmailWithOtpSchema>;

class VerifyEmailWithOtpDto extends BaseDto<
  typeof verifyEmailWithOtpSchema.shape
> {
  constructor() {
    super(verifyEmailWithOtpSchema);
  }
}

export default new VerifyEmailWithOtpDto();
