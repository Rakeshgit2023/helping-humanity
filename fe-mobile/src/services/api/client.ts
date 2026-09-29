import axios from 'axios';

import { env } from '@/config/env';
import { API_TIMEOUT_MS } from '@/constants/config';
import { attachInterceptors } from '@/services/api/interceptors';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

attachInterceptors(apiClient);
