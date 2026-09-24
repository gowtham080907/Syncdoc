export type EditorRole = 
  | 'Computer Science Engineering'
  | 'Lead Technical Writer' 
  | 'Frontend Engineer' 
  | 'AST Architect' 
  | 'Backend Engineer' 
  | 'Reviewer';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  color: string;
  role?: string;
  about?: string;
  status?: string;
  createdAt?: string;
}

export interface UserProfile extends User {
  password?: string;
  bio?: string;
  isOnline?: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  name: string;
  username: string;
  email: string;
  password?: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export const INITIAL_EDITORS: UserProfile[] = [
  {
    id: 'usr-1',
    name: 'Sujitha Reddy',
    username: 'sujitha',
    email: 'sujitha@example.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    color: '#3b82f6',
    role: 'Computer Science Engineering',
    about: 'Lead Frontend Architect & Collaborative Engine Specialist.',
    isOnline: true,
  },
  {
    id: 'usr-2',
    name: 'Sree',
    username: 'sree',
    email: 'sree@example.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: '#10b981',
    role: 'Frontend Engineer',
    about: 'Building custom block editor UI and presence tracking.',
    isOnline: true,
  },
  {
    id: 'usr-3',
    name: 'Rahul',
    username: 'rahul',
    email: 'rahul@example.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: '#f59e0b',
    role: 'AST & Conflict Resolution Lead',
    about: 'Designing AST diffing algorithms and tree merging.',
    isOnline: true,
  },
  {
    id: 'usr-4',
    name: 'Ananya',
    username: 'ananya',
    email: 'ananya@example.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    color: '#ec4899',
    role: 'Backend & Database Engineer',
    about: 'Managing Express endpoints, Yjs websocket rooms, and MongoDB persistence.',
    isOnline: false,
  },
];
