import { apiClient } from './apiClient';
import { ApiResponse, Order } from '@/types';

export type CreateOrderPayload = {
  productId: string;
  quantity?: number;
  shippingAddress?: string;
  phone?: string;
  note?: string;
};

export const orderService = {
  async create(payload: CreateOrderPayload): Promise<Order> {
    const res = await apiClient.post<ApiResponse<{ order: Order }>>('/orders', payload);
    return res.data.data.order;
  },

  async getMyOrders(): Promise<Order[]> {
    const res = await apiClient.get<ApiResponse<{ orders: Order[] }>>('/orders/me');
    return res.data.data.orders;
  },

  async getById(id: string): Promise<Order> {
    const res = await apiClient.get<ApiResponse<{ order: Order }>>(`/orders/${id}`);
    return res.data.data.order;
  },

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const res = await apiClient.patch<ApiResponse<{ order: Order }>>(`/orders/${id}/cancel`, { reason });
    return res.data.data.order;
  },
};
