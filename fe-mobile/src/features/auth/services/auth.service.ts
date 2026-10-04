import { apiClient } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  SendOtpPayload,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from '@/features/auth/types/auth.types';

interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>(
      ENDPOINTS.auth.login,
      payload,
    );
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<{ message: string; data: RegisterResponse }>(
      ENDPOINTS.auth.register,
      payload,
    );
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.get(ENDPOINTS.auth.logout);
  },

  async sendOtpForEmailVerification(payload: SendOtpPayload): Promise<void> {
    await apiClient.post(ENDPOINTS.auth.sendOtp, payload);
  },

  async verifyEmailWithOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    const { data } = await apiClient.post<{ message: string; data: VerifyOtpResponse }>(
      ENDPOINTS.auth.verifyEmail,
      payload,
    );
    return data.data;
  },
};
