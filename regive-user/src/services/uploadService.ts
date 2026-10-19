import { apiClient } from './apiClient';
import { ApiResponse } from '@/types';

export type UploadResponse = {
  url: string;
  publicId: string | null;
  filename?: string;
  originalName?: string;
  size: number;
  mimetype: string;
  storage?: 'local' | 'cloudinary';
};

export type UploadMultipleResponse = {
  files: UploadResponse[];
};

export const uploadService = {
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post<ApiResponse<UploadResponse>>('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return res.data.data;
  },

  async uploadMultipleImages(files: File[]): Promise<UploadMultipleResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const res = await apiClient.post<ApiResponse<UploadMultipleResponse>>('/uploads/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data.data;
  },

  async deleteImage(publicId: string, filename?: string): Promise<void> {
    // Endpoint đúng: DELETE /uploads/delete với body { publicId } (Cloudinary) hoặc { filename } (local)
    await apiClient.delete('/uploads/delete', { data: { publicId, filename } });
  },
};