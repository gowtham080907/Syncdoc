/**
 * In-Memory Document Store
 * NOTE: Data is stored in memory and resets on server restart.
 */

const getInitialBlocks = () => [
  {
    id: 'block-intro-heading',
    type: 'heading',
    content: 'SyncDoc Architecture Specification',
    order: 0,
    metadata: { headingLevel: 1 },
  },
  {
    id: 'block-intro-para',
    type: 'paragraph',
    content: 'SyncDoc is a real-time collaborative document engine using Yjs CRDTs and AST node structures to eliminate destructive concurrent overwrites.',
    order: 1,
  },
  {
    id: 'block-code-example',
    type: 'code',
    content: 'const syncDoc = new Y.Doc();\nconst blocksMap = syncDoc.getMap("blocks");\nconsole.log("CRDT doc initialized", syncDoc.guid);',
    order: 2,
    metadata: { language: 'typescript' },
  },
  {
    id: 'block-quote-sec',
    type: 'quote',
    content: 'Fine-grained block tracking ensures isolated keystrokes and seamless multi-user collaboration.',
    order: 3,
  },
  {
    id: 'block-list-features',
    type: 'list',
    content: 'Real-time Yjs CRDT state sync',
    order: 4,
    metadata: { listType: 'bullet' },
  },
  {
    id: 'block-list-features-2',
    type: 'list',
    content: 'Block-level isolated re-renders (No cursor jumps)',
    order: 5,
    metadata: { listType: 'bullet' },
  },
  {
    id: 'block-list-features-3',
    type: 'list',
    content: 'AST node rendering & conflict resolution UI',
    order: 6,
    metadata: { listType: 'bullet' },
  },
];

const createSeedDocuments = () => [
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
    blocks: getInitialBlocks(),
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

let documents = createSeedDocuments();

/**
 * Returns all documents (without deep blocks if metadata listing is requested).
 */
export const getAllDocuments = () => {
  return documents.map(({ blocks, ...meta }) => ({ ...meta }));
};

/**
 * Finds a document by ID.
 */
export const getDocumentById = (id) => {
  const doc = documents.find((d) => String(d.id) === String(id));
  return doc ? { ...doc } : null;
};

/**
 * Creates a new document.
 */
export const createDocument = ({ title, description, author }) => {
  const newDoc = {
    id: `doc-${Date.now()}`,
    title: title ? title.trim() : 'Untitled Technical Document',
    description: description ? description.trim() : 'New collaborative structured document.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: author || {
      id: 'usr-me',
      name: 'Authenticated User',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    activeUsersCount: 1,
    blockCount: 2,
    tags: ['New'],
    blocks: [
      {
        id: `blk-${Date.now()}-1`,
        type: 'heading',
        content: title ? title.trim() : 'Untitled Technical Document',
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

  documents.unshift(newDoc);
  return newDoc;
};

/**
 * Updates an existing document by ID.
 */
export const updateDocument = (id, updates) => {
  const index = documents.findIndex((d) => String(d.id) === String(id));
  if (index === -1) return null;

  const current = documents[index];
  const updatedDoc = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.blocks && Array.isArray(updates.blocks)) {
    updatedDoc.blockCount = updates.blocks.length;
  }

  documents[index] = updatedDoc;
  return updatedDoc;
};

/**
 * Deletes a document by ID.
 */
export const deleteDocument = (id) => {
  const index = documents.findIndex((d) => String(d.id) === String(id));
  if (index === -1) return false;
  documents.splice(index, 1);
  return true;
};

/**
 * Resets the in-memory document store to initial seed documents.
 */
export const resetStore = () => {
  documents = createSeedDocuments();
};

export default {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  resetStore,
};
