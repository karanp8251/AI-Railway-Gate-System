import { API_URL } from '../config/constants';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_URL}${endpoint}`;
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = !options.method || options.method === 'GET'
    ? `${url}${separator}_cb=${Date.now()}`
    : url;

  const res = await fetch(finalUrl, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  get: (url) => request(url),
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};

export function downloadCSV(type) {
  const token = localStorage.getItem('token');
  window.open(`${API_URL}/reports/csv/${type}?token=${token}`, '_blank');
}
