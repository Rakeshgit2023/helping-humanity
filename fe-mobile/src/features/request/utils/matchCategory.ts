import type { Category } from '@/features/category/types/category.types';

// Local UI category -> words to look for in the server's category name.
// Order matters: "money" must not match "blood donation", so it checks fund/money/cash only.
const KEYWORDS: Record<string, RegExp> = {
  animal: /animal/i,
  food: /food/i,
  blood: /blood/i,
  clothes: /cloth/i,
  money: /fund|money|cash/i,
};

/** Finds the server category (uuid + name) that belongs to a local UI category. */
export function matchCategory(localId: string, categories: Category[] | undefined) {
  const pattern = KEYWORDS[localId];
  const found = pattern ? categories?.find((c) => c.isActive && pattern.test(c.name)) : undefined;
  return found ? { id: found.id, name: found.name } : null;
}
