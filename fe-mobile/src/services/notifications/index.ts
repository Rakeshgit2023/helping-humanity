export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Placeholder for push notification wiring (e.g. expo-notifications).
// Kept as a stable import path so features can depend on it before the
// concrete provider is decided.
export const notifications = {
  async registerForPushNotifications(): Promise<string | null> {
    return null;
  },
};