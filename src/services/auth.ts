import { User, LoginCredentials, RegisterCredentials, AuthResponse, INITIAL_EDITORS } from '../types/user';
import { getCurrentUser as fetchApiUser } from './api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AUTH_TOKEN_KEY = 'syncdoc_auth_token';
const AUTH_USER_KEY = 'syncdoc_current_user';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const matchedUser = INITIAL_EDITORS.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    ) || {
      id: `usr-${Date.now()}`,
      name: credentials.email.split('@')[0] || 'Authenticated User',
      username: credentials.email.split('@')[0] || 'user',
      email: credentials.email,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      color: '#3b82f6',
      role: 'Computer Science Engineering',
      about: 'Collaborative document editor user.',
      isOnline: true,
    };

    const token = `mock-jwt-token-${Date.now()}`;
    const user: User = {
      id: matchedUser.id,
      name: matchedUser.name,
      username: matchedUser.username,
      email: matchedUser.email,
      avatar: matchedUser.avatar,
      color: matchedUser.color,
      role: matchedUser.role,
      about: matchedUser.about,
    };

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    return { user, token };
  }

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Invalid credentials' }));
    throw new Error(err.message || 'Login failed');
  }

  const data = await res.json();
  const token = data.token || data.data?.token;
  const user = data.user || data.data?.user;

  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  return { user, token };
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user: User = {
      id: `usr-${Date.now()}`,
      name: credentials.name,
      username: credentials.username,
      email: credentials.email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      color: '#10b981',
      role: 'Computer Science Engineering',
      about: 'New SyncDoc member.',
    };

    const token = `mock-jwt-token-${Date.now()}`;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    return { user, token };
  }

  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(err.message || 'Registration failed');
  }

  const data = await res.json();
  const token = data.token || data.data?.token;
  const user = data.user || data.data?.user;

  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  return { user, token };
}

export async function logout(): Promise<void> {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  const cachedUserStr = localStorage.getItem(AUTH_USER_KEY);
  if (cachedUserStr) {
    try {
      return JSON.parse(cachedUserStr);
    } catch {
      // Fallback
    }
  }

  if (isAuthenticated()) {
    try {
      const user = await fetchApiUser();
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  }

  return null;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
};
