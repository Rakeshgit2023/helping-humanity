import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

const createCategorySchema = z.object({
  categories: z
    .array(
      z.object({
        name: z
          .string({
            error: "Category name is required and it should be a string",
          })
          .trim()
          .min(1, "Category name is required")
          .min(5, "Category name cannot be less than 5 characters")
          .max(50, "Category name cannot exceed 50 characters"),
      }),
    )
    .min(1, "At least one category is required")
    .max(10, "You can select maximum 10 categories"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

class CreateCategoryDto extends BaseDto<typeof createCategorySchema.shape> {
  constructor() {
    super(createCategorySchema);
  }
}

export default new CreateCategoryDto();
