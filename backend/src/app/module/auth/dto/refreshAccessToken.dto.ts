import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";
import { roleValues } from "../../../comman/utils/constant.js";

export const refreshAccessTokenSchema = z.object({
  token: z.string({ error: "Refresh token is required" }).trim(),
  sessionId: z.uuid("Session id is required").trim(),
});

export type RefreshAccessTokenInput = z.infer<typeof refreshAccessTokenSchema>;

export const RefreshAccessTokenResponseSchema = z.object({
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

export type RefreshAccessTokenResponseInput = z.infer<
  typeof RefreshAccessTokenResponseSchema
>;

class RefreshAccessTokenDto extends BaseDto<
  typeof refreshAccessTokenSchema.shape
> {
  constructor() {
    super(refreshAccessTokenSchema);
  }
}

export default new RefreshAccessTokenDto();
