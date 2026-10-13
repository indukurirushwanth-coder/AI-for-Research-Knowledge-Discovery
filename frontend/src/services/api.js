import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login/register page, clear token
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// --- Research Endpoints ---
export const researchApi = {
  getHealth: () => api.get('/health'),
  getDocuments: () => api.get('/research/documents'),
  uploadDocuments: (formData, onProgress) => api.post('/research/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  deleteDocument: (id) => api.delete(`/research/documents/${id}`),
  askQuestion: (data) => api.post('/research/ask', data),
  comparePapers: (data) => api.post('/research/compare', data),
  synthesizeResearch: (data) => api.post('/research/synthesize', data),
  getHistory: () => api.get('/research/history')
};

export default api;
