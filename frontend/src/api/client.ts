// Centralized API Client managing auth headers
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  path: string;
  timestamp: string;
}

export class ApiError extends Error {
  status: number;
  originalMessage: string;

  constructor(status: number, message: string, originalMessage: string) {
    super(message);
    this.status = status;
    this.originalMessage = originalMessage;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function normalizeErrorMessage(status: number, originalMsg: string): string {
  // If the message is a raw Spring trace/exception, ignore it and fall back to general messages
  if (originalMsg && (
    originalMsg.includes('Exception') || 
    originalMsg.includes('org.springframework') || 
    originalMsg.includes('constraint') ||
    originalMsg.includes('SQLState') ||
    originalMsg.includes('DataIntegrity')
  )) {
    // Fall through to general mapping
  } else if (originalMsg) {
    return originalMsg;
  }

  switch (status) {
    case 400:
      return 'The request is invalid. Please check your input fields.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource or context was not found.';
    case 409:
      return 'A conflict occurred. The resource key or name might already exist.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'A server error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred. Please check your internet connection.';
  }
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
  
  const activeOrgId = localStorage.getItem('activeOrgId');
  if (activeOrgId) {
    headers['X-Organization-Id'] = activeOrgId;
  }
  
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new ApiError(
      0,
      'Connection problem. Unable to reach the server. Please check your network connection.',
      netErr instanceof Error ? netErr.message : 'Network error'
    );
  }
  
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let payload: any;
  try {
    payload = await response.json();
  } catch {
    // If response does not contain json (e.g. raw text or empty)
    if (!response.ok) {
      throw new ApiError(
        response.status,
        normalizeErrorMessage(response.status, ''),
        response.statusText
      );
    }
    return {} as T;
  }
  
  if (!response.ok) {
    const rawMsg = payload.message || payload.error || '';
    const userMsg = normalizeErrorMessage(response.status, rawMsg);
    throw new ApiError(response.status, userMsg, rawMsg);
  }
  
  return payload;
}

export default apiClient;
