import { DocumentBlock } from './block';
import { User } from './user';

export type DocumentFilter = 'all' | 'recent' | 'shared' | 'starred';

export interface DocumentMeta {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner?: Partial<User>;
  collaborators?: Partial<User>[];
  lastEditor?: string;
  isStarred?: boolean;
  isShared?: boolean;
  activeUsersCount?: number;
  blockCount?: number;
  tags?: string[];
  isArchived?: boolean;
}

export interface Document extends DocumentMeta {
  blocks: DocumentBlock[];
  version?: number;
}

export type DocumentDetail = Document;

export interface CreateDocumentPayload {
  title: string;
  description?: string;
  initialBlocks?: DocumentBlock[];
}

export interface UpdateDocumentPayload {
  title?: string;
  description?: string;
  blocks?: DocumentBlock[];
  isStarred?: boolean;
}
