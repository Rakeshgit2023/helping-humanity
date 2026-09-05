import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

const interestSchema = z.object({
  interests: z
    .array(
      z.object({
        name: z
          .string({
            error: "Interest name is required and it should be a string",
          })
          .trim()
          .min(1, "Interest name cannot be empty")
          .max(50, "Interest name cannot exceed 50 characters"),
      }),
    )
    .min(1, "At least one interest is required")
    .max(10, "You can select maximum 10 interests"),
});

export type InterestInput = z.infer<typeof interestSchema>;

class InterestDto extends BaseDto<typeof interestSchema.shape> {
  constructor() {
    super(interestSchema);
  }
}

export default new InterestDto();
