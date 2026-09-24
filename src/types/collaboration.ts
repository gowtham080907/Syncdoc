export type ConnectionStatus = 'connected' | 'connecting' | 'syncing' | 'disconnected';
export type SyncStatus = 'saved' | 'saving' | 'syncing' | 'offline' | 'error';

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  currentBlockId?: string | null;
  cursorOffset?: number | null;
  selection?: {
    anchor: number;
    head: number;
  } | null;
  lastActive: string;
  presenceState?: 'active' | 'idle' | 'offline';
}

export interface CursorPosition {
  blockId: string;
  position: number;
}

export interface SelectionRange {
  blockId: string;
  start: number;
  end: number;
}

export interface RemoteCursorState {
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  blockId: string;
  position?: number;
  offset?: number;
  selectionRange?: [number, number] | { start: number; end: number } | null;
  coords?: { top: number; left: number; height: number };
}

export interface AwarenessState {
  user: PresenceUser;
}

export type CollaborationEvent = 
  | 'join-document'
  | 'leave-document'
  | 'document-update'
  | 'presence-update'
  | 'cursor-update'
  | 'selection-update'
  | 'conflict-update';
