import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const requestIdParamSchema = z.object({
  requestId: z
    .string({ error: "Request id is required" })
    .trim()
    .min(1, "Request id is required")
    .pipe(z.uuid("Request id must be a valid UUID")),
});

export type RequestIdParamInput = z.infer<typeof requestIdParamSchema>;

class RequestIdParamDto extends BaseDto<typeof requestIdParamSchema.shape> {
  constructor() {
    super(requestIdParamSchema);
  }
}

export default new RequestIdParamDto();
