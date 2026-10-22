import { apiClient } from './apiClient';
import { ApiResponse, Donation, DonationType, ProductDonationInfo } from '@/types';

export type CreateDonationPayload = {
  campaignId: string;
  type: DonationType;
  amount?: number;
  isAnonymous?: boolean;
  note?: string;
  productInfo?: ProductDonationInfo;
};

export const donationService = {
  async createDonation(payload: CreateDonationPayload): Promise<Donation> {
    const res = await apiClient.post<ApiResponse<{ donation: Donation }>>('/donations', payload);
    return res.data.data.donation;
  },

  async getMyDonations(): Promise<Donation[]> {
    const res = await apiClient.get<ApiResponse<{ donations: Donation[] }>>('/donations/me');
    return res.data.data.donations;
  },

  async getById(id: string): Promise<Donation> {
    const res = await apiClient.get<ApiResponse<{ donation: Donation }>>(`/donations/${id}`);
    return res.data.data.donation;
  },
};
