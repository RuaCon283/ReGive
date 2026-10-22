import { apiClient } from './apiClient';
import { ApiResponse, SupportRequest, SupportUrgency } from '@/types';

export type CreateSupportPayload = {
  title: string;
  description: string;
  urgency?: SupportUrgency;
  campaignId?: string;
};

export const supportService = {
  async create(payload: CreateSupportPayload): Promise<SupportRequest> {
    const res = await apiClient.post<ApiResponse<{ supportRequest: SupportRequest }>>(
      '/support-requests',
      payload
    );
    return res.data.data.supportRequest;
  },

  async getMyRequests(): Promise<SupportRequest[]> {
    const res = await apiClient.get<ApiResponse<{ supportRequests: SupportRequest[] }>>(
      '/support-requests/me'
    );
    return res.data.data.supportRequests;
  },

  async getById(id: string): Promise<SupportRequest> {
    const res = await apiClient.get<ApiResponse<{ supportRequest: SupportRequest }>>(
      `/support-requests/${id}`
    );
    return res.data.data.supportRequest;
  },

  async confirmReceived(id: string): Promise<SupportRequest> {
    const res = await apiClient.post<ApiResponse<{ supportRequest: SupportRequest }>>(
      `/support-requests/${id}/confirm-received`
    );
    return res.data.data.supportRequest;
  },
};
