import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, INITIAL_EDITORS } from '../types/user';

export interface AuthContextType {
  currentUser: UserProfile | null;
  editors: UserProfile[];
  login: (userId: string) => void;
  loginWithCredentials: (userIdOrEmail: string, password: string) => { success: boolean; message?: string };
  registerUser: (userData: {
    userId: string;
    name: string;
    email: string;
    password: string;
    role?: UserProfile['role'];
    color?: string;
    avatar?: string;
  }) => { success: boolean; message?: string };
  logout: () => void;
  switchEditor: (userId: string) => void;
  addEditor: (editorData: Omit<UserProfile, 'id'>) => UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USER = 'syncdoc_current_user_id';
const LOCAL_STORAGE_KEY_EDITORS = 'syncdoc_editors_list';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUserId = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
    if (savedUserId) {
      const found = editors.find((e) => e.id.toLowerCase() === savedUserId.toLowerCase());
      if (found) return found;
    }
    return INITIAL_EDITORS[1]; // Default to Sree V
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_EDITORS, JSON.stringify(editors));
  }, [editors]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, currentUser.id);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    }
  }, [currentUser]);

  const login = (userId: string) => {
    const found = editors.find(
      (e) => e.id.toLowerCase() === userId.toLowerCase() || e.email.toLowerCase() === userId.toLowerCase()
    );
    if (found) {
      setCurrentUser(found);
    }
  };

  const loginWithCredentials = (userIdOrEmail: string, password: string): { success: boolean; message?: string } => {
    const term = userIdOrEmail.trim().toLowerCase();
    const found = editors.find(
      (e) => e.id.toLowerCase() === term || e.email.toLowerCase() === term
    );

    if (!found) {
      return { success: false, message: 'Invalid User ID or Email Address.' };
    }

    // If account has password, verify it
    if (found.password && found.password !== password) {
      return { success: false, message: 'Incorrect Password. Please try again.' };
    }

    setCurrentUser(found);
    return { success: true };
  };

  const registerUser = (userData: {
    userId: string;
    name: string;
    email: string;
    password: string;
    role?: UserProfile['role'];
    color?: string;
    avatar?: string;
  }): { success: boolean; message?: string } => {
    const cleanId = userData.userId.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();

    const existsId = editors.some((e) => e.id.toLowerCase() === cleanId);
    if (existsId) {
      return { success: false, message: 'User ID is already taken. Please pick another User ID.' };
    }

    const existsEmail = editors.some((e) => e.email.toLowerCase() === cleanEmail);
    if (existsEmail) {
      return { success: false, message: 'Email address is already registered. Please sign in instead.' };
    }

    const newEditor: UserProfile = {
      id: userData.userId.trim(),
      name: userData.name.trim(),
      username: userData.userId.trim().toLowerCase(),
      email: userData.email.trim(),
      password: userData.password,
      role: userData.role || 'Frontend Engineer',
      color: userData.color || '#3b82f6',
      avatar:
        userData.avatar?.trim() ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      bio: 'Collaborative SyncDoc technical specification editor.',
    };

    setEditors((prev) => [...prev, newEditor]);
    setCurrentUser(newEditor);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
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
