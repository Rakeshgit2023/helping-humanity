import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const sendOtpForEmailVerificationSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
});

export type SendOtpForEmailVerificationInput = z.infer<
  typeof sendOtpForEmailVerificationSchema
>;

export const sendOtpForEmailVerificationResponseSchema = z.object({
  message: z.string(),
  data: z.null(),
});

export type SendOtpForEmailVerificationResponseInput = z.infer<
  typeof sendOtpForEmailVerificationResponseSchema
>;

class SendOtpForEmailVerificationDto extends BaseDto<
  typeof sendOtpForEmailVerificationSchema.shape
> {
  constructor() {
    super(sendOtpForEmailVerificationSchema);
  }
}

export default new SendOtpForEmailVerificationDto();
