import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { ConnectionStatus, PresenceUser } from '../types/collaboration';

export interface YjsSession {
  doc: Y.Doc;
  provider: WebsocketProvider | null;
  status: ConnectionStatus;
  destroy: () => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:1234';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const createYjsSession = (
  roomName: string,
  onStatusChange?: (status: ConnectionStatus) => void
): YjsSession => {
  const doc = new Y.Doc();
  let provider: WebsocketProvider | null = null;
  let currentStatus: ConnectionStatus = 'connecting';

  const setStatus = (status: ConnectionStatus) => {
    currentStatus = status;
    if (onStatusChange) onStatusChange(status);
  };

  if (!USE_MOCK) {
    try {
      provider = new WebsocketProvider(WS_URL, roomName, doc);

      provider.on('status', (event: { status: 'connected' | 'connecting' | 'disconnected' }) => {
        setStatus(event.status);
      });
    } catch (err) {
      console.warn('Yjs WebsocketProvider error, reverting to local CRDT session:', err);
      setStatus('disconnected');
    }
  } else {
    // In Mock Mode, simulate instant connection success
    setTimeout(() => {
      setStatus('connected');
    }, 200);
  }

  return {
    doc,
    provider,
    get status() {
      return currentStatus;
    },
    destroy: () => {
      if (provider) {
        provider.destroy();
      }
      doc.destroy();
    },
  };
};

// Simulated mock peer users for presence demonstration
export const MOCK_PRESENCE_USERS: PresenceUser[] = [
  {
    id: 'usr-sim-1',
    name: 'Sree V',
    color: '#10b981', // emerald
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    currentBlockId: 'block-intro-para',
    cursorOffset: 12,
    lastActive: new Date().toISOString(),
  },
  {
    id: 'usr-sim-2',
    name: 'Alex Rivera',
    color: '#8b5cf6', // purple
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    currentBlockId: 'block-code-example',
    cursorOffset: 25,
    lastActive: new Date().toISOString(),
  },
  {
    id: 'usr-sim-3',
    name: 'Elena Rostova',
    color: '#f59e0b', // amber
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    currentBlockId: 'block-quote-sec',
    cursorOffset: 5,
    lastActive: new Date().toISOString(),
  },
];
