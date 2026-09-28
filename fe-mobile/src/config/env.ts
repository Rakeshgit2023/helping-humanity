export type AppEnv = 'development' | 'staging' | 'production';

interface EnvConfig {
  apiUrl: string;
  env: AppEnv;
}

function readRequiredEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function resolveAppEnv(): AppEnv {
  const raw = process.env.EXPO_PUBLIC_ENV ?? 'development';
  if (raw === 'development' || raw === 'staging' || raw === 'production') {
    return raw;
  }
  return 'development';
}

export const env: EnvConfig = {
  apiUrl: readRequiredEnv('EXPO_PUBLIC_API_URL', 'http://localhost:5085'),
  env: resolveAppEnv(),
};

export const isProduction = env.env === 'production';
export const isDevelopment = env.env === 'development';
