import { ilike } from "drizzle-orm";
import ApiError from "../../comman/utils/api.error.js";
import { db } from "../../../db/index.js";
import { interestTable } from "../../../db/schema.js";
import type { InterestInput } from "./dto/create.dto.js";
import type { SearchInput } from "./dto/search.dto.js";

export const create = async ({ interests }: InterestInput) => {
  try {
    await db.insert(interestTable).values(interests).returning();
  } catch (error: any) {
    if (error?.cause?.code === "23505") {
      throw ApiError.conflict(error.cause.detail);
    }

    throw error;
  }
};

export const search = async ({ name }: SearchInput) => {
  return await db
    .select()
    .from(interestTable)
    .where(ilike(interestTable.name, `%${name}%`));
};
