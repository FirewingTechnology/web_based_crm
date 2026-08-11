import axios from 'axios';

const DEFAULT_BACKEND_URL = 'https://web-based-crm.onrender.com/api/v1';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8001/api/v1';
  }
  return DEFAULT_BACKEND_URL;
};



const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Access Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('realvion_access_token') || localStorage.getItem('brokeros_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Handle 401 & Refresh Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest?.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('realvion_refresh_token') || localStorage.getItem('brokeros_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = res.data;
          localStorage.setItem('realvion_access_token', access_token);
          localStorage.setItem('realvion_refresh_token', refresh_token);
          localStorage.setItem('brokeros_access_token', access_token);
          localStorage.setItem('brokeros_refresh_token', refresh_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('realvion_access_token');
          localStorage.removeItem('realvion_refresh_token');
          localStorage.removeItem('brokeros_access_token');
          localStorage.removeItem('brokeros_refresh_token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        localStorage.removeItem('realvion_access_token');
        localStorage.removeItem('realvion_refresh_token');
        localStorage.removeItem('brokeros_access_token');
        localStorage.removeItem('brokeros_refresh_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);


