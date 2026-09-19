import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

const searchCategorySchema = z.object({
  name: z
    .string({
      error: "Category name is required and it should be a string",
    })
    .trim()
    .min(2, "Category name cannot be less than 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
});

export type SearchCategoryInput = z.infer<typeof searchCategorySchema>;

class SearchCategoryDto extends BaseDto<typeof searchCategorySchema.shape> {
  constructor() {
    super(searchCategorySchema);
  }
}

export default new SearchCategoryDto();
