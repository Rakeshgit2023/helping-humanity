import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const chatHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.iso.datetime().optional(),
});

export type ChatHistoryQueryInput = z.infer<typeof chatHistoryQuerySchema>;

class ChatHistoryQueryDto extends BaseDto<typeof chatHistoryQuerySchema.shape> {
  constructor() {
    super(chatHistoryQuerySchema);
  }
}

export default new ChatHistoryQueryDto();
