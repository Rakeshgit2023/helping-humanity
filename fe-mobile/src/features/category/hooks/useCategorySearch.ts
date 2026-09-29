import { useQuery } from '@tanstack/react-query';

import { categoryService } from '@/features/category/services/category.service';

const MIN_QUERY_LENGTH = 2;

export function useCategorySearch(query: string) {
  const trimmed = query.trim();
  const enabled = trimmed.length >= MIN_QUERY_LENGTH;

  return useQuery({
    queryKey: ['categories', 'search', trimmed],
    // React Query passes an AbortSignal per fetch and aborts the previous
    // one as soon as the query key changes — typing a new character cancels
    // whatever search for the prior text was still in flight.
    queryFn: ({ signal }) => categoryService.searchCategories(trimmed, signal),
    enabled,
    placeholderData: (previous) => previous,
  });
}
