import { DocumentMeta, Document, CreateDocumentPayload, UpdateDocumentPayload } from '../types/document';
import { User, UserProfile } from '../types/user';
import { getInitialDocumentBlocks } from '../utils/blockUtils';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Initial Mock User Profile
let CURRENT_MOCK_USER: UserProfile = {
  id: 'usr-1',
  name: 'Sujitha Reddy',
  username: 'sujitha',
  email: 'sujitha@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  color: '#3b82f6',
  role: 'Computer Science Engineering',
  about: 'Lead Frontend Architect working on CRDTs & AST conflict UI.',
  isOnline: true,
};

// In-memory mock documents store
const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    title: 'SyncDoc Architecture & AST Conflict Resolver',
    description: 'Technical overview of Yjs CRDT synchronization and AST node structure merging.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    ownerId: 'usr-1',
    owner: {
      id: 'usr-1',
      name: 'Sujitha Reddy',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    collaborators: [
      { id: 'usr-2', name: 'Sree', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
      { id: 'usr-3', name: 'Rahul', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
    ],
    lastEditor: 'Sree',
    isStarred: true,
    isShared: true,
    activeUsersCount: 3,
    blockCount: 7,
    tags: ['Architecture', 'Yjs', 'AST'],
    blocks: getInitialDocumentBlocks(),
    version: 42,
  },
  {
    id: 'doc-2',
    title: 'Frontend API & Component Interfaces',
    description: 'Clean TypeScript contracts and React component specifications for team integration.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    ownerId: 'usr-2',
    owner: {
      id: 'usr-2',
      name: 'Sree',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    collaborators: [
      { id: 'usr-1', name: 'Sujitha Reddy', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
    ],
    lastEditor: 'Sujitha Reddy',
    isStarred: false,
    isShared: true,
    activeUsersCount: 1,
    blockCount: 4,
    tags: ['Frontend', 'React', 'TypeScript'],
    blocks: [
      {
        id: 'blk-201',
        type: 'heading',
        content: 'API Integration Contract',
        order: 0,
        metadata: { headingLevel: 1 },
      },
      {
        id: 'blk-202',
        type: 'paragraph',
        content: 'All network calls are funneled through services/api.ts to guarantee smooth backend swap.',
        order: 1,
      },
    ],
    version: 15,
  },
  {
    id: 'doc-3',
    title: 'Real-time WebSocket Benchmarks',
    description: 'Latency metrics and delta tracking benchmarks under multi-client loads.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    ownerId: 'usr-3',
    owner: {
      id: 'usr-3',
      name: 'Rahul',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    collaborators: [],
    lastEditor: 'Rahul',
    isStarred: true,
    isShared: false,
    activeUsersCount: 1,
    blockCount: 5,
    tags: ['Performance', 'WebSockets', 'CRDT'],
    blocks: [
      {
        id: 'blk-301',
        type: 'heading',
        content: 'Performance Metrics',
        order: 0,
        metadata: { headingLevel: 1 },
      },
      {
        id: 'blk-302',
        type: 'code',
        content: '// Simulated delta tracking test latency\nconst pingTimeMs = 14;\nconsole.log(`P99 Latency: ${pingTimeMs}ms`);',
        order: 1,
        metadata: { language: 'typescript' },
      },
    ],
    version: 8,
  },
];

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 150));
    return CURRENT_MOCK_USER;
  }
  const token = localStorage.getItem('syncdoc_auth_token');
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.data || data;
}

export async function updateProfile(updates: Partial<UserProfile>): Promise<User> {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 250));
    CURRENT_MOCK_USER = {
      ...CURRENT_MOCK_USER,
      ...updates,
    };
    return CURRENT_MOCK_USER;
  }
  const token = localStorage.getItem('syncdoc_auth_token');
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  const data = await res.json();
  return data.data || data;
}

export async function getDocuments(): Promise<DocumentMeta[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_DOCUMENTS.map(({ blocks, ...meta }) => meta);
  }
  const token = localStorage.getItem('syncdoc_auth_token');
  const res = await fetch(`${API_BASE_URL}/documents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return data.data || data;
}

export async function getDocument(id: string): Promise<Document> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const doc = MOCK_DOCUMENTS.find((d) => d.id === id);
    if (doc) return { ...doc };
    return {
      id,
      title: 'New Collaborative Document',
      description: 'Created via SyncDoc Engine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: CURRENT_MOCK_USER.id,
      owner: {
        id: CURRENT_MOCK_USER.id,
        name: CURRENT_MOCK_USER.name,
        avatar: CURRENT_MOCK_USER.avatar,
      },
      activeUsersCount: 1,
      blockCount: 4,
      tags: ['Draft'],
      blocks: getInitialDocumentBlocks(),
      version: 1,
    };
  }
  const token = localStorage.getItem('syncdoc_auth_token');
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch document ${id}`);
  const data = await res.json();
  return data.data || data;
}

export async function createDocument(payload: CreateDocumentPayload | string, desc?: string): Promise<Document> {
  const title = typeof payload === 'string' ? payload : payload.title;
  const description = typeof payload === 'string' ? (desc || 'New collaborative document.') : (payload.description || desc || 'New collaborative document.');

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: title || 'Untitled Technical Document',
      description: description || 'New collaborative document.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: CURRENT_MOCK_USER.id,
      owner: {
        id: CURRENT_MOCK_USER.id,
        name: CURRENT_MOCK_USER.name,
        avatar: CURRENT_MOCK_USER.avatar,
      },
      activeUsersCount: 1,
      blockCount: 2,
      tags: ['New'],
      blocks: typeof payload === 'object' && payload.initialBlocks ? payload.initialBlocks : [
        {
          id: `blk-${Date.now()}-1`,
          type: 'heading',
          content: title || 'Untitled Technical Document',
          order: 0,
          metadata: { headingLevel: 1 },
        },
        {
          id: `blk-${Date.now()}-2`,
          type: 'paragraph',
          content: 'Start editing your technical specification collaboratively...',
          order: 1,
        },
      ],
      version: 1,
    };
    MOCK_DOCUMENTS.unshift(newDoc);
    return newDoc;
  }

  const token = localStorage.getItem('syncdoc_auth_token');
  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(typeof payload === 'string' ? { title } : payload),
  });
  if (!res.ok) throw new Error('Failed to create document');
  const data = await res.json();
  return data.data || data;
}

export async function updateDocument(id: string, updates: UpdateDocumentPayload | Partial<DocumentMeta>): Promise<DocumentMeta> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = MOCK_DOCUMENTS.findIndex((d) => d.id === id);
    if (index !== -1) {
      MOCK_DOCUMENTS[index] = {
        ...MOCK_DOCUMENTS[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      const { blocks, ...meta } = MOCK_DOCUMENTS[index];
      return meta;
    }
    throw new Error('Document not found');
  }
  const token = localStorage.getItem('syncdoc_auth_token');
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update document');
  const data = await res.json();
  return data.data || data;
}

export async function deleteDocument(id: string): Promise<boolean> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = MOCK_DOCUMENTS.findIndex((d) => d.id === id);
    if (index !== -1) {
      MOCK_DOCUMENTS.splice(index, 1);
      return true;
    }
    return false;
  }
  const token = localStorage.getItem('syncdoc_auth_token');
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return true;
}

export const apiService = {
  getCurrentUser,
  updateProfile,
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};
