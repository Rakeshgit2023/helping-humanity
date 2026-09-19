import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";
import { roleValues } from "../../../comman/utils/constant.js";

export const signInSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),

  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signInResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({
      id: z.uuid(),
      firstName: z.string(),
      lastName: z.string().nullable(),
      email: z.email(),
      role: z.enum(roleValues),
    }),
    accessToken: z.string(),
    refreshToken: z.string(),
    sessionId: z.uuid(),
  }),
});

export type SignInResponseInput = z.infer<typeof signInResponseSchema>;

class SignInDto extends BaseDto<typeof signInSchema.shape> {
  constructor() {
    super(signInSchema);
  }
}

export default new SignInDto();
