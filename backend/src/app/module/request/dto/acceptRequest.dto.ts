import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const acceptRequestBodySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  requestId: z
    .string({ error: "Request id is required" })
    .trim()
    .min(1, "Request id is required")
    .pipe(z.uuid("Request id must be a valid UUID")),
});

export type AcceptRequestBodyInput = z.infer<typeof acceptRequestBodySchema>;

class AcceptRequestBodyDto extends BaseDto<
  typeof acceptRequestBodySchema.shape
> {
  constructor() {
    super(acceptRequestBodySchema);
  }
}

export default new AcceptRequestBodyDto();
