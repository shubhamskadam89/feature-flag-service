// Centralized API Client managing auth headers
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  path: string;
  timestamp: string;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const payload = await response.json();
  
  if (!response.ok) {
    throw new Error(payload.message || 'API request failed.');
  }
  
  return payload;
}
export default apiClient;
