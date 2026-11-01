import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";
import type { RequestIdParamInput } from "./requestIdParam.dto.js";

export const acceptRequestBodySchema = z.object({
  lat: z.coerce
    .number()
    .min(-90)
    .max(90)
    .openapi({ description: "Volunteer latitude at acceptance time" }),
  lng: z.coerce
    .number()
    .min(-180)
    .max(180)
    .openapi({ description: "Volunteer longitude at acceptance time" }),
});

export type AcceptRequestBodyInput = RequestIdParamInput &
  z.infer<typeof acceptRequestBodySchema>;

class AcceptRequestBodyDto extends BaseDto<
  typeof acceptRequestBodySchema.shape
> {
  constructor() {
    super(acceptRequestBodySchema);
  }
}

export default new AcceptRequestBodyDto();
