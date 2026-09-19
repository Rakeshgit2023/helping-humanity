import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

export const searchCategorySchema = z.object({
  name: z
    .string({
      error: "Category name is required and it should be a string",
    })
    .trim()
    .min(2, "Category name cannot be less than 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
});

export type SearchCategoryInput = z.infer<typeof searchCategorySchema>;

export const searchCategoryResponseSchema = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      isActive: z.boolean(),
    }),
  ),
});

export type SearchCategoryResponseInput = z.infer<
  typeof searchCategoryResponseSchema
>;

class SearchCategoryDto extends BaseDto<typeof searchCategorySchema.shape> {
  constructor() {
    super(searchCategorySchema);
  }
}

export default new SearchCategoryDto();
