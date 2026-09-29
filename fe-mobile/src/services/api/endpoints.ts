export const ENDPOINTS = {
  auth: {
    login: '/auth/signIn',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    sendOtp: '/auth/sendOtpForEmailVerification',
    verifyEmail: '/auth/verifyEmailWithOtp',
  },
  category: {
    list: '/category',
  },
  user: {
    profile: '/users/me',
    updateProfile: '/users/me',
  },
} as const;
