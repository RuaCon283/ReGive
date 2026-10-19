import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const TOKEN_KEY = 'regive_token';

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.message ||
      (error.response?.data?.errors &&
        Array.isArray(error.response.data.errors) &&
        error.response.data.errors.map((e: any) => e.msg).join(', ')) ||
      error.message ||
      'Có lỗi xảy ra, vui lòng thử lại.';

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isAuthPage =
          window.location.pathname.startsWith('/login') ||
          window.location.pathname.startsWith('/register');
        if (!isAuthPage && tokenStorage.get()) {
          tokenStorage.remove();
          // Token hết hạn: đẩy người dùng về trang đăng nhập để đăng nhập lại
          window.location.replace('/login');
        }
      }
    }

    return Promise.reject(new Error(message));
  }
);
