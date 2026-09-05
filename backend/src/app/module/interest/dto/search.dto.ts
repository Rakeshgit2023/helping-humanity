import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

const searchSchema = z.object({
  name: z
    .string({
      error: "name is required and it should be a string",
    })
    .trim()
    .min(2, "Name cannot be less than 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
});

export type SearchInput = z.infer<typeof searchSchema>;

class SearchDto extends BaseDto<typeof searchSchema.shape> {
  constructor() {
    super(searchSchema);
  }
}

export default new SearchDto();
