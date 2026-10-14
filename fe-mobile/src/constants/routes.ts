export const ROUTES = {
  login: '/(auth)/login',
  register: '/(auth)/register',
  home: '/(protected)/home',
  activity: '/(protected)/activity',
  impact: '/(protected)/impact',
  requestFlow: '/(protected)/request/flow',
  profile: '/(protected)/profile',
  settings: '/(protected)/settings',
} as const;

export const requestFormRoute = (category: string) =>
  ({ pathname: '/(protected)/request/form', params: { category } }) as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
