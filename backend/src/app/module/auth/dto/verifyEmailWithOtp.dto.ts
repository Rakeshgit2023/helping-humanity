import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const verifyEmailWithOtpSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),

  otp: z
    .string({ error: "OTP is required" })
    .min(6, "OTP must be 6 digits long")
    .max(6, "OTP must be 6 digits long"),
});

export type VerifyEmailWithOtpInput = z.infer<typeof verifyEmailWithOtpSchema>;

export const verifyEmailWithOtpResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    userId: z.uuid(),
    email: z.email(),
  }),
});

export type verifyEmailWithOtpResponseInput = z.infer<
  typeof verifyEmailWithOtpResponseSchema
>;

class VerifyEmailWithOtpDto extends BaseDto<
  typeof verifyEmailWithOtpSchema.shape
> {
  constructor() {
    super(verifyEmailWithOtpSchema);
  }
}

export default new VerifyEmailWithOtpDto();
