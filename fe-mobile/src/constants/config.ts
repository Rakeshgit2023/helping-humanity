export const APP_NAME = 'fe-mobile';

export const API_TIMEOUT_MS = 15000;

export const STORAGE_KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
} as const;

export const SOCKET_EVENTS = {
  locationUpdate: 'location:update',
} as const;

export const LOCATION_TRACKING = {
  timeIntervalMs: 1000,
  distanceIntervalM: 200,
} as const;
