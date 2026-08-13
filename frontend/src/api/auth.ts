// Auth Service API calls referencing environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  path: string;
  timestamp: string;
}

export async function loginApi(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'Login failed. Please check your credentials.');
  }
  return payload;
}

export async function registerApi(name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'Registration failed. Please review input fields.');
  }
  return payload;
}
