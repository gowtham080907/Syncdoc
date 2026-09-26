import { UserProfile } from '../types/user';

const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export interface AuthApiResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    createdAt?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

/**
 * Shared low-level API fetch helper with error normalization.
 */
async function apiFetch<T = AuthApiResponse>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new Error('Unable to reach backend server. Please verify the backend is running.');
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      if (response.status === 401) throw new Error('Invalid email or password.');
      if (response.status === 403) throw new Error('Access forbidden.');
      if (response.status === 404) throw new Error('Requested resource not found.');
      if (response.status === 501) throw new Error('Feature not implemented on backend.');
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    return {} as T;
  }

  if (!response.ok || data.success === false) {
    const errorMsg =
      data?.error?.message ||
      data?.message ||
      (response.status === 401
        ? 'Invalid email or password'
        : response.status === 403
        ? 'Access forbidden'
        : response.status === 404
        ? 'Requested resource not found'
        : response.status === 501
        ? 'Feature not implemented on backend'
        : `Request failed with status ${response.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}

/**
 * Register a new user with the backend API.
 */
export async function registerUserApi(name: string, email: string, password: string): Promise<AuthApiResponse> {
  return apiFetch<AuthApiResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

/**
 * Log in an existing user with the backend API.
 */
export async function loginUserApi(email: string, password: string): Promise<AuthApiResponse> {
  return apiFetch<AuthApiResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Fetch current user profile using JWT token.
 */
export async function getCurrentUserApi(token: string): Promise<AuthApiResponse> {
  return apiFetch<AuthApiResponse>('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Send logout request to backend API.
 */
export async function logoutUserApi(token?: string | null): Promise<AuthApiResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await apiFetch<AuthApiResponse>('/auth/logout', {
      method: 'POST',
      headers,
    });
  } catch (err) {
    // If logout endpoint fails, logouts on client side should still succeed gracefully
    return { success: true, message: 'Logged out locally' };
  }
}

/**
 * Maps backend user object to frontend UserProfile type.
 */
export function mapBackendUserToProfile(backendUser: { id: string; name: string; email: string }): UserProfile {
  return {
    id: backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    role: 'Frontend Engineer',
    color: '#3b82f6',
    bio: 'Collaborative SyncDoc technical specification editor.',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(backendUser.name)}`,
  };
}
