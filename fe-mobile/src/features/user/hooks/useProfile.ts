import { useQuery } from '@tanstack/react-query';

import { userService } from '@/features/user/services/user.service';

export function useProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userService.getProfile,
  });
}
