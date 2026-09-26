import { DocumentMeta, DocumentDetail } from '../types/document';
import { getInitialDocumentBlocks } from '../utils/blockUtils';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// In-memory mock documents store for standalone client development
const MOCK_DOCUMENTS: DocumentDetail[] = [
  {
    id: 'doc-1',
    title: 'SyncDoc Architecture & AST Conflict Resolver',
    description: 'Technical overview of Yjs CRDT synchronization and AST node structure merging.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    author: {
      id: 'usr-1',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    activeUsersCount: 3,
    blockCount: 7,
    tags: ['Architecture', 'Yjs', 'AST'],
    blocks: getInitialDocumentBlocks(),
  },
  {
    id: 'doc-2',
    title: 'Frontend API & Component Interfaces',
    description: 'Clean TypeScript contracts and React component specifications for team integration.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    author: {
      id: 'usr-2',
      name: 'Sree V',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
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
  },
  {
    id: 'doc-3',
    title: 'Real-time WebSocket Benchmarks',
    description: 'Latency metrics and delta tracking benchmarks under multi-client loads.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    author: {
      id: 'usr-3',
      name: 'David Chen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    activeUsersCount: 2,
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
  },
];

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('syncdoc_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleApiResponse<T>(res: Response, defaultErrorMsg: string): Promise<T> {
  let data: any = null;
  try {
    data = await res.json();
  } catch (e) {
    // Response was not JSON
  }

  if (!res.ok) {
    const serverMsg = data?.error?.message || data?.message;
    if (serverMsg) throw new Error(serverMsg);

    switch (res.status) {
      case 400:
        throw new Error('Validation error: Invalid request data.');
      case 401:
        throw new Error('Authentication required or session expired. Please sign in.');
      case 403:
        throw new Error('Access forbidden.');
      case 404:
        throw new Error('Requested document or resource not found.');
      case 500:
        throw new Error('Internal backend server error.');
      case 501:
        throw new Error('Feature not implemented on backend.');
      default:
        throw new Error(defaultErrorMsg);
    }
  }

  return (data?.data ?? data?.documents ?? data?.document ?? data) as T;
}

export const apiService = {
  async getDocuments(): Promise<DocumentMeta[]> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_DOCUMENTS.map(({ blocks, ...meta }) => meta);
    }
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/documents`, {
        headers: getAuthHeaders(),
      });
    } catch (err) {
      throw new Error('Unable to reach backend server. Please verify the backend is running.');
    }
    return handleApiResponse<DocumentMeta[]>(res, 'Failed to fetch documents');
  },

  async getDocument(id: string): Promise<DocumentDetail> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const doc = MOCK_DOCUMENTS.find((d) => d.id === id);
      if (doc) return { ...doc };
      // Fallback default doc if ID not found in mock array
      return {
        id,
        title: 'New Collaborative Document',
        description: 'Created via SyncDoc Engine',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 'usr-me',
          name: 'You (Current User)',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        },
        activeUsersCount: 1,
        blockCount: 4,
        tags: ['Draft'],
        blocks: getInitialDocumentBlocks(),
      };
    }
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        headers: getAuthHeaders(),
      });
    } catch (err) {
      throw new Error('Unable to reach backend server. Please verify the backend is running.');
    }
    return handleApiResponse<DocumentDetail>(res, `Failed to fetch document ${id}`);
  },

  async createDocument(title: string, description?: string): Promise<DocumentDetail> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const newDoc: DocumentDetail = {
        id: `doc-${Date.now()}`,
        title: title || 'Untitled Technical Document',
        description: description || 'New collaborative structured document.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 'usr-me',
          name: 'You (Current User)',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        },
        activeUsersCount: 1,
        blockCount: 2,
        tags: ['New'],
        blocks: [
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
      };
      MOCK_DOCUMENTS.unshift(newDoc);
      return newDoc;
    }
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, description }),
      });
    } catch (err) {
      throw new Error('Unable to reach backend server. Please verify the backend is running.');
    }
    return handleApiResponse<DocumentDetail>(res, 'Failed to create document');
  },

  async updateDocument(id: string, updates: Partial<DocumentMeta>): Promise<DocumentMeta> {
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
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      throw new Error('Unable to reach backend server. Please verify the backend is running.');
    }
    return handleApiResponse<DocumentMeta>(res, 'Failed to update document');
  },

  async deleteDocument(id: string): Promise<boolean> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const index = MOCK_DOCUMENTS.findIndex((d) => d.id === id);
      if (index !== -1) {
        MOCK_DOCUMENTS.splice(index, 1);
        return true;
      }
      return false;
    }
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      throw new Error('Unable to reach backend server. Please verify the backend is running.');
    }
    await handleApiResponse<any>(res, 'Failed to delete document');
    return true;
  },
};

