import { apiClient } from './apiClient';
import { ApiResponse, VolunteerRegistration } from '@/types';

export type RegisterVolunteerPayload = {
  campaignId: string;
  skills?: string;
  availabilityNote?: string;
};

export const volunteerService = {
  async register(payload: RegisterVolunteerPayload): Promise<VolunteerRegistration> {
    const res = await apiClient.post<ApiResponse<{ registration: VolunteerRegistration }>>(
      '/volunteers/register',
      payload
    );
    return res.data.data.registration;
  },

  async getMyRegistrations(): Promise<VolunteerRegistration[]> {
    const res = await apiClient.get<ApiResponse<{ registrations: VolunteerRegistration[] }>>(
      '/volunteers/me'
    );
    return res.data.data.registrations;
  },

  /**
   * Lấy chi tiết một đăng ký tình nguyện.
   * Ưu tiên endpoint chi tiết (đầy đủ campaign + người duyệt);
   * nếu backend cũ chưa có endpoint này thì fallback về danh sách /volunteers/me.
   */
  async getById(id: string): Promise<VolunteerRegistration> {
    try {
      const res = await apiClient.get<ApiResponse<{ registration: VolunteerRegistration }>>(
        `/volunteers/${id}`
      );
      return res.data.data.registration;
    } catch {
      const res = await apiClient.get<ApiResponse<{ registrations: VolunteerRegistration[] }>>(
        '/volunteers/me'
      );
      const found = res.data.data.registrations.find((item) => item._id === id);
      if (!found) throw new Error('Không tìm thấy đăng ký tình nguyện');
      return found;
    }
  },
};
