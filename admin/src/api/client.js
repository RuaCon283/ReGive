const TOKEN_KEY = 'regive_admin_token';
const inFlightReadRequests = new Map();

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function buildUrl(path, query) {
  const base = import.meta.env.VITE_API_URL || '';
  const url = new URL(`${base}${path}`, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return `${url.pathname}${url.search}`;
}

export async function api(path, { method = 'GET', body, query, isFormData = false } = {}) {
  const requestMethod = method.toUpperCase();
  const url = buildUrl(path, query);
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  const run = async () => {
    const res = await fetch(url, {
      method: requestMethod,
      headers,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      // Token hết hạn hoặc không hợp lệ: xoá token và về trang đăng nhập
      if (res.status === 401) {
        setToken(null);
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
      const err = new Error(json.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.errors = json.errors;
      throw err;
    }
    return json;
  };

  if (requestMethod !== 'GET' && requestMethod !== 'HEAD') return run();

  const requestKey = `${requestMethod}:${url}:${token || ''}`;
  if (inFlightReadRequests.has(requestKey)) return inFlightReadRequests.get(requestKey);

  const request = run().finally(() => {
    inFlightReadRequests.delete(requestKey);
  });
  inFlightReadRequests.set(requestKey, request);
  return request;
}

export const authApi = {
  login: (email, password) => api('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => api('/api/auth/me'),
  updateMe: (body) => api('/api/auth/me', { method: 'PATCH', body }),
  users: (query) => api('/api/auth/users', { query }),
  updateRole: (id, role) => api(`/api/auth/users/${id}/role`, { method: 'PATCH', body: { role } }),
  updateStatus: (id, isActive) => api(`/api/auth/users/${id}/status`, { method: 'PATCH', body: { isActive } }),
};

export const campaignApi = {
  listAll: (query) => api('/api/campaigns/manage/all', { query }),
  get: (id) => api(`/api/campaigns/${id}`),
  create: (body) => api('/api/campaigns', { method: 'POST', body }),
  update: (id, body) => api(`/api/campaigns/${id}`, { method: 'PATCH', body }),
  remove: (id) => api(`/api/campaigns/${id}`, { method: 'DELETE' }),
  donations: (id) => api(`/api/campaigns/${id}/donations`),
  volunteers: (id) => api(`/api/campaigns/${id}/volunteers`),
  addActivity: (id, body) => api(`/api/campaigns/${id}/activities`, { method: 'POST', body }),
};

export const donationApi = {
  list: (query) => api('/api/donations', { query }),
  get: (id) => api(`/api/donations/${id}`),
  updateStatus: (id, status) =>
    api(`/api/donations/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const volunteerApi = {
  list: (query) => api('/api/volunteers', { query }),
  review: (id, body) => api(`/api/volunteers/${id}/review`, { method: 'PATCH', body }),
};

export const supportApi = {
  list: (query) => api('/api/support-requests', { query }),
  get: (id) => api(`/api/support-requests/${id}`),
  review: (id, body) => api(`/api/support-requests/${id}/review`, { method: 'PATCH', body }),
};

export const productApi = {
  list: (query) => api('/api/products', { query }),
  get: (id) => api(`/api/products/${id}`),
  update: (id, body) => api(`/api/products/${id}`, { method: 'PATCH', body }),
  intake: (body) => api('/api/products/intake', { method: 'POST', body }),
  assess: (id, body) => api(`/api/products/${id}/assess`, { method: 'POST', body }),
  publish: (id) => api(`/api/products/${id}/publish`, { method: 'POST' }),
  unpublish: (id) => api(`/api/products/${id}/unpublish`, { method: 'POST' }),
};

export const inventoryApi = {
  summary: () => api('/api/inventory/summary'),
  transactions: (query) => api('/api/inventory/transactions', { query }),
  stockIn: (body) => api('/api/inventory/stock-in', { method: 'POST', body }),
  stockOut: (body) => api('/api/inventory/stock-out', { method: 'POST', body }),
  adjust: (body) => api('/api/inventory/adjust', { method: 'POST', body }),
};

export const orderApi = {
  list: (query) => api('/api/orders', { query }),
  get: (id) => api(`/api/orders/${id}`),
  updateStatus: (id, body) => api(`/api/orders/${id}/status`, { method: 'PATCH', body }),
};

export const paymentApi = {
  list: (query) => api('/api/payments', { query }),
  get: (id) => api(`/api/payments/${id}`),
};

export const reportApi = {
  overview: () => api('/api/reports/overview'),
};

export const aiApi = {
  pending: () => api('/api/ai/pending'),
  assess: (body) => api('/api/ai/assess-product', { method: 'POST', body }),
  byProduct: (productId) => api(`/api/ai/products/${productId}`),
  get: (id) => api(`/api/ai/assessments/${id}`),
  confirm: (id, body) => api(`/api/ai/assessments/${id}/confirm`, { method: 'POST', body }),
  reject: (id) => api(`/api/ai/assessments/${id}/reject`, { method: 'POST' }),
};

export const uploadApi = {
  single: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api('/api/uploads/single', { method: 'POST', body: formData, isFormData: true });
  },
  multiple: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api('/api/uploads/multiple', { method: 'POST', body: formData, isFormData: true });
  },
  delete: (publicId) => api('/api/uploads/delete', { method: 'DELETE', body: { publicId } }),
};

export const notificationApi = {
  list: (query) => api('/api/notifications', { query }),
  read: (id) => api(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () => api('/api/notifications/read-all', { method: 'PATCH' }),
};
