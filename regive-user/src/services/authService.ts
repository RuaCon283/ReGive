import { apiClient } from './apiClient';
import { ApiResponse, Role, User } from '@/types';

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  role?: Role;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponseData = {
  user: User;
  token: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  phone?: string;
  address?: string;
  beneficiaryInfo?: {
    householdSize?: number;
    note?: string;
  };
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type VerifyEmailPayload = {
  token: string;
};

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', payload);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', payload);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data.user;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await apiClient.patch<ApiResponse<{ user: User }>>('/auth/me', payload);
    return res.data.data.user;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<string> {
    const res = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', payload);
    return res.data.message || 'Đã gửi email đặt lại mật khẩu.';
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<string> {
    const res = await apiClient.post<ApiResponse<null>>('/auth/reset-password', payload);
    return res.data.message || 'Đặt lại mật khẩu thành công.';
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<User> {
    const res = await apiClient.post<ApiResponse<{ user: User }>>('/auth/verify-email', payload);
    return res.data.data.user;
  },

  async resendVerification(): Promise<string> {
    const res = await apiClient.post<ApiResponse<null>>('/auth/resend-verification');
    return res.data.message || 'Đã gửi lại email xác thực.';
  },
};
