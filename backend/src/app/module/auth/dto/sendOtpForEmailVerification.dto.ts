import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

const sendOtpForEmailVerificationSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
});

export type SendOtpForEmailVerificationInput = z.infer<
  typeof sendOtpForEmailVerificationSchema
>;

class SendOtpForEmailVerificationDto extends BaseDto<
  typeof sendOtpForEmailVerificationSchema.shape
> {
  constructor() {
    super(sendOtpForEmailVerificationSchema);
  }
}

export default new SendOtpForEmailVerificationDto();
