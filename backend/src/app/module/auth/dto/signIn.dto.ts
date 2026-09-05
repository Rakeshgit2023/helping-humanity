import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

const signInSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),

  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

class SignInDto extends BaseDto<typeof signInSchema.shape> {
  constructor() {
    super(signInSchema);
  }
}

export default new SignInDto();
