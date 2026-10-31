import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const volunteersForRequestSchema = z.object({
  requestId: z
    .string({ error: "Request id is required" })
    .trim()
    .min(1, "Request id is required")
    .pipe(z.uuid("Request id must be a valid UUID")),
});

export type VolunteersForRequestInput = z.infer<
  typeof volunteersForRequestSchema
>;

class VolunteersForRequestDto extends BaseDto<
  typeof volunteersForRequestSchema.shape
> {
  constructor() {
    super(volunteersForRequestSchema);
  }
}

export default new VolunteersForRequestDto();
