export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

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
}

export interface RemoteCursorState {
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  blockId: string;
  offset: number;
  selectionRange?: [number, number] | null;
  coords?: { top: number; left: number; height: number };
}

export interface AwarenessState {
  user: PresenceUser;
}
