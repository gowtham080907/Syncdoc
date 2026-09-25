export interface DocumentMeta {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  activeUsersCount?: number;
  blockCount?: number;
  tags?: string[];
  isArchived?: boolean;
}

export interface DocumentDetail extends DocumentMeta {
  blocks: DocumentBlock[];
}

import { DocumentBlock } from './block';
