import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const broadcastListQuerySchema = z.object({
  status: z.enum(["pending", "all"]).default("pending"),
});
export type BroadcastListQueryInput = z.infer<typeof broadcastListQuerySchema>;

class BroadcastListQueryDto extends BaseDto<
  typeof broadcastListQuerySchema.shape
> {
  constructor() {
    super(broadcastListQuerySchema);
  }
}
export default new BroadcastListQueryDto();
