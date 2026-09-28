export const ENDPOINTS = {
  auth: {
    login: '/auth/signIn',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  category: {
    list: '/category',
  },
  user: {
    profile: '/users/me',
    updateProfile: '/users/me',
  },
} as const;
