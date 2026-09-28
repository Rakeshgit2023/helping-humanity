import { apiClient } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';
import type { Category } from '@/features/category/types/category.types';

export const categoryService = {
  async fetchCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<{ message: string; data: Category[] }>(
      ENDPOINTS.category.list,
    );
    return data.data;
  },
};
