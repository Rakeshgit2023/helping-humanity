import ApiError from "../../comman/utils/api.error.js";
import { db } from "../../../db/index.js";
import type { CreateCategoryInput } from "./dto/createCategory.dto.js";
import type { SearchCategoryInput } from "./dto/searchCategory.dto.js";
import { withErrorHandling } from "../../comman/middleware/withErrorHandling.js";
import { category } from "../../../db/schema.js";
import { ilike } from "drizzle-orm";

export const createCategory = withErrorHandling(
  "Create Category",
  async ({ categories }: CreateCategoryInput) => {
    const createdCategories = await db
      .insert(category)
      .values(categories)
      .returning({
        id: category.id,
        name: category.name,
      });

    if (createdCategories.length === 0) {
      throw new ApiError(400, "Failed to create category");
    }
    return createdCategories;
  },
);

export const searchCategory = withErrorHandling(
  "Search Category",
  async ({ name }: SearchCategoryInput) => {
    return await db
      .select({
        id: category.id,
        name: category.name,
        isActive: category.isActive,
      })
      .from(category)
      .where(ilike(category.name, `%${name}%`));
  },
);
