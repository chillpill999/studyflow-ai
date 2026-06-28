import axios, { AxiosInstance } from 'axios';
import { useStore } from '../store/useStore';

// Get base url from environment variables or default to local FastAPI dev port
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject Supabase JWT access token on the fly
apiClient.interceptors.request.use(
  (config) => {
    const session = useStore.getState().session;
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle generic failures (token expirations, 401s)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Auto logout if authorization fails (unauthorized / session expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear sessions in global state if 401 unauthorized occurs
      const logoutFn = useStore.getState().logout;
      await logoutFn();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
