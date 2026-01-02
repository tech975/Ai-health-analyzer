import axios from 'axios';
import { ApiResponse, LoginCredentials, RegisterCredentials, AuthResponse, User, PatientFormData, Report, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Simple in-memory cache for API responses
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

const apiCache = new ApiCache();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout (default)
});

// Request interceptor to add auth token and caching
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add cache headers for GET requests
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'max-age=300'; // 5 minutes
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and caching
api.interceptors.response.use(
  (response) => {
    // Cache GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.method}:${response.config.url}`;
      apiCache.set(cacheKey, response.data, 300000); // 5 minutes
    }

    return response;
  },
  (error) => {
    // Handle unauthorized access
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      apiCache.clear(); // Clear cache on auth error
      window.location.href = '/login';
    }

    // Log API errors in development
    if (import.meta.env.DEV) {
      console.error('🚨 API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

// Cached API request helper
const cachedRequest = async <T>(
  requestFn: () => Promise<T>,
  cacheKey: string,
  ttl: number = 300000
): Promise<T> => {
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await requestFn();
  apiCache.set(cacheKey, result, ttl);
  return result;
};

// Health check
export const healthCheck = async (): Promise<ApiResponse> => {
  const response = await api.get('/health');
  return response.data;
};

// Authentication API functions
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data!;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    return response.data.data!;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data.data!;
  },
};

// File upload API functions
export const fileApi = {
  uploadFile: async (file: File, onProgress?: (progress: number) => void): Promise<{ fileId: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ fileId: string; url: string }>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for large file uploads
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data.data!;
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await api.delete(`/files/${fileId}`);
  },
};

// Report API functions
export const reportApi = {
  createReport: async (patientData: PatientFormData, fileId: string): Promise<Report> => {
    const response = await api.post<ApiResponse<Report>>('/reports/upload', {
      patientInfo: patientData,
      fileId,
    });
    // Clear cache after creating new report
    apiCache.delete('get:/reports/user/');
    return response.data.data!;
  },

  analyzeReport: async (fileId: string, patientData: PatientFormData): Promise<Report> => {
    const response = await api.post<ApiResponse<Report>>(`/reports/analyze`, { 
      fileId,
      patientInfo: patientData 
    }, {
      timeout: 180000 // 3 minutes for AI analysis
    });
    // Clear related cache entries
    apiCache.clear();
    return response.data.data!;
  },

  getReport: async (reportId: string): Promise<Report> => {
    return cachedRequest(
      async () => {
        const response = await api.get<ApiResponse<Report>>(`/reports/${reportId}`);
        return response.data.data!;
      },
      `report:${reportId}`,
      600000 // 10 minutes for individual reports
    );
  },

  getUserReports: async (userId: string, filters?: { search?: string; age?: number; gender?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Report>> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.age) params.append('age', filters.age.toString());
    if (filters?.gender) params.append('gender', filters.gender);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const cacheKey = `user-reports:${userId}:${params.toString()}`;
    
    return cachedRequest(
      async () => {
        const response = await api.get<ApiResponse<PaginatedResponse<Report>>>(`/reports/user/${userId}?${params.toString()}`);
        return response.data.data!;
      },
      cacheKey,
      180000 // 3 minutes for report lists
    );
  },

  deleteReport: async (reportId: string): Promise<void> => {
    await api.delete(`/reports/${reportId}`);
    // Clear related cache entries
    apiCache.delete(`report:${reportId}`);
    apiCache.clear(); // Clear all cache to ensure consistency
  },

  deleteMultipleReports: async (reportIds: string[]): Promise<void> => {
    await api.post('/reports/bulk-delete', { reportIds });
    // Clear all cache after bulk delete
    apiCache.clear();
  },

  downloadReport: async (reportId: string, format: 'pdf' | 'word'): Promise<Blob> => {
    const response = await api.post(`/reports/${reportId}/download`, 
      { format },
      { 
        responseType: 'blob',
        headers: {
          'Accept': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        timeout: 60000 // 60 seconds for downloads
      }
    );
    return response.data;
  },

  shareReport: async (reportId: string): Promise<{ shareUrl: string; expiresAt: string }> => {
    const response = await api.post<ApiResponse<{ shareUrl: string; expiresAt: string }>>(`/reports/${reportId}/share`);
    return response.data.data!;
  },
};

// Export cache utilities for manual cache management
export const cacheUtils = {
  clear: () => apiCache.clear(),
  delete: (key: string) => apiCache.delete(key),
  get: (key: string) => apiCache.get(key),
};