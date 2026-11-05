import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const sendChatMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;

class SendChatMessageDto extends BaseDto<typeof sendChatMessageSchema.shape> {
  constructor() {
    super(sendChatMessageSchema);
  }
}

export default new SendChatMessageDto();
