export const ROUTES = {
  login: '/(auth)/login',
  register: '/(auth)/register',
  home: '/(protected)/home',
  profile: '/(protected)/profile',
  settings: '/(protected)/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
