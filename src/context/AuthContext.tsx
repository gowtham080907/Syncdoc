import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, INITIAL_EDITORS } from '../types/user';
import {
  registerUserApi,
  loginUserApi,
  getCurrentUserApi,
  logoutUserApi,
  mapBackendUserToProfile,
} from '../services/authApi';

export interface AuthContextType {
  currentUser: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  editors: UserProfile[];
  login: (userId: string) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (userData: {
    name: string;
    email: string;
    password: string;
    role?: UserProfile['role'];
    color?: string;
    avatar?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchEditor: (userId: string) => void;
  addEditor: (editorData: Omit<UserProfile, 'id'>) => UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TOKEN = 'syncdoc_jwt_token';
const LOCAL_STORAGE_KEY_EDITORS = 'syncdoc_editors_list';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(LOCAL_STORAGE_KEY_TOKEN));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [editors, setEditors] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_EDITORS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse saved editors:', err);
      }
    }
    return INITIAL_EDITORS;
  });

  // Step 6: Session Restore on App Startup
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const savedToken = localStorage.getItem(LOCAL_STORAGE_KEY_TOKEN);
      if (!savedToken) {
        if (isMounted) {
          setToken(null);
          setCurrentUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await getCurrentUserApi(savedToken);
        if (response.success && response.user && isMounted) {
          const profile = mapBackendUserToProfile(response.user);
          setCurrentUser(profile);
          setToken(savedToken);
        } else if (isMounted) {
          localStorage.removeItem(LOCAL_STORAGE_KEY_TOKEN);
          setToken(null);
          setCurrentUser(null);
        }
      } catch (err) {
        if (isMounted) {
          // Token invalid, expired, or server unreachable
          localStorage.removeItem(LOCAL_STORAGE_KEY_TOKEN);
          setToken(null);
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_EDITORS, JSON.stringify(editors));
  }, [editors]);

  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await loginUserApi(email, password);
      if (response.success && response.token && response.user) {
        const profile = mapBackendUserToProfile(response.user);
        localStorage.setItem(LOCAL_STORAGE_KEY_TOKEN, response.token);
        setToken(response.token);
        setCurrentUser(profile);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Invalid email or password' };
    }
  };

  const registerUser = async (userData: {
    name: string;
    email: string;
    password: string;
    role?: UserProfile['role'];
    color?: string;
    avatar?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const regResponse = await registerUserApi(userData.name, userData.email, userData.password);
      if (!regResponse.success) {
        return { success: false, message: regResponse.message || 'Registration failed.' };
      }

      // Automatically log user in after successful registration
      const loginResponse = await loginUserApi(userData.email, userData.password);
      if (loginResponse.success && loginResponse.token && loginResponse.user) {
        const profile = mapBackendUserToProfile(loginResponse.user);
        if (userData.role) profile.role = userData.role;
        if (userData.color) profile.color = userData.color;
        if (userData.avatar) profile.avatar = userData.avatar;

        localStorage.setItem(LOCAL_STORAGE_KEY_TOKEN, loginResponse.token);
        setToken(loginResponse.token);
        setCurrentUser(profile);
        return { success: true };
      }

      return { success: true, message: 'Account created successfully! Please sign in.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    const currentToken = token;
    localStorage.removeItem(LOCAL_STORAGE_KEY_TOKEN);
    setToken(null);
    setCurrentUser(null);

    if (currentToken) {
      try {
        await logoutUserApi(currentToken);
      } catch (err) {
        // Ignore errors during remote logout
      }
    }
  };

  const login = (userId: string) => {
    const found = editors.find(
      (e) => e.id.toLowerCase() === userId.toLowerCase() || e.email.toLowerCase() === userId.toLowerCase()
    );
    if (found) {
      setCurrentUser(found);
    }
  };

  const switchEditor = (userId: string) => {
    login(userId);
  };

  const addEditor = (editorData: Omit<UserProfile, 'id'>): UserProfile => {
    const newEditor: UserProfile = {
      ...editorData,
      id: `usr-${Date.now()}`,
      password: 'password123',
    };
    setEditors((prev) => [...prev, newEditor]);
    setCurrentUser(newEditor);
    return newEditor;
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setEditors((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        editors,
        login,
        loginWithCredentials,
        registerUser,
        logout,
        switchEditor,
        addEditor,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
