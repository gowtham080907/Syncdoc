export type EditorRole = 'Lead Technical Writer' | 'Frontend Engineer' | 'AST Architect' | 'Backend Engineer' | 'Reviewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  color: string;
  role: EditorRole;
  bio?: string;
  isOnline?: boolean;
}

export const INITIAL_EDITORS: UserProfile[] = [
  {
    id: 'alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@syncdoc.io',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#8b5cf6', // purple
    role: 'Lead Technical Writer',
    bio: 'Architecting Yjs CRDT synchronization and document node structures.',
  },
  {
    id: 'sree',
    name: 'Sree V',
    email: 'sree.v@syncdoc.io',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: '#10b981', // emerald
    role: 'Frontend Engineer',
    bio: 'Building block editor UI and delta tracking React layers.',
  },
  {
    id: 'david',
    name: 'David Chen',
    email: 'david.chen@syncdoc.io',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: '#3b82f6', // blue
    role: 'AST Architect',
    bio: 'Designing AST conflict resolution matrices and tree merging rules.',
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@syncdoc.io',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    color: '#f59e0b', // amber
    role: 'Backend Engineer',
    bio: 'Managing Express, Mongoose schemas, and Socket.io routing engine.',
  },
];
