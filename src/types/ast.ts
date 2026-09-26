import { BlockType } from './block';

export interface ASTNode {
  id: string;
  type: BlockType;
  content: string;
  children?: ASTNode[];
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface ASTDocument {
  version: number;
  root: ASTNode[];
}

export interface ASTConflict {
  id: string;
  nodeId: string;
  blockId: string;
  path: string[];
  baseVersion: number;
  localVersion: {
    content: string;
    updatedBy: string;
    updatedAt: string;
  };
  remoteVersion: {
    content: string;
    updatedBy: string;
    updatedAt: string;
  };
  status: 'pending' | 'resolved';
  resolution?: 'keep_mine' | 'keep_remote' | 'merged';
}

export type Conflict = ASTConflict;

export type ConflictResolutionChoice = 'keep_mine' | 'keep_remote' | 'merged';
