import { isAxiosError } from 'axios';

export type AppErrorKind = 'network' | 'auth' | 'validation' | 'server' | 'unknown';

export interface AppError {
  kind: AppErrorKind;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export function toAppError(error: unknown): AppError {
  if (isAxiosError(error)) {
    if (!error.response) {
      return { kind: 'network', message: 'Unable to reach the server. Check your connection.' };
    }

    const status = error.response.status;
    const body = error.response.data as
      { message?: string; errors?: Record<string, string[]> } | undefined;

    if (status === 401 || status === 403) {
      return {
        kind: 'auth',
        message: body?.message ?? 'You are not authorized. Please sign in again.',
      };
    }

    if (status === 422 || status === 400) {
      return {
        kind: 'validation',
        message: body?.message ?? 'Please check the highlighted fields.',
        fieldErrors: body?.errors,
      };
    }

    if (status >= 500) {
      return { kind: 'server', message: 'The server had a problem. Please try again shortly.' };
    }

    return { kind: 'unknown', message: body?.message ?? FALLBACK_MESSAGE };
  }

  if (error instanceof Error) {
    return { kind: 'unknown', message: error.message || FALLBACK_MESSAGE };
  }

  return { kind: 'unknown', message: FALLBACK_MESSAGE };
}
