import { apiClient } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';
import type { UpdateProfilePayload, UserProfile } from '@/features/user/types/user.types';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>(ENDPOINTS.user.profile);
    return data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const { data } = await apiClient.put<UserProfile>(ENDPOINTS.user.updateProfile, payload);
    return data;
  },
};
