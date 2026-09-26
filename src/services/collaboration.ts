import { ConnectionStatus, PresenceUser, CursorPosition, RemoteCursorState } from '../types/collaboration';

type EventCallback = (...args: any[]) => void;

class CollaborationService {
  private status: ConnectionStatus = 'disconnected';
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private currentRoom: string | null = null;
  private ws: WebSocket | null = null;

  public connect(documentId: string): void {
    this.currentRoom = documentId;
    this.setStatus('connecting');

    // Simulate WS connection or connect to VITE_WS_URL if available
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (wsUrl && import.meta.env.VITE_USE_MOCK_DATA === 'false') {
      try {
        this.ws = new WebSocket(`${wsUrl}?room=${documentId}`);
        this.ws.onopen = () => this.setStatus('connected');
        this.ws.onclose = () => this.setStatus('disconnected');
        this.ws.onerror = () => this.setStatus('disconnected');
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data.event, data.payload);
          } catch {
            // Non-JSON message
          }
        };
      } catch {
        this.setStatus('disconnected');
      }
    } else {
      // Mock mode auto-connects
      setTimeout(() => {
        this.setStatus('connected');
      }, 300);
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentRoom = null;
    this.setStatus('disconnected');
  }

  public joinDocument(documentId: string, user: PresenceUser): void {
    this.currentRoom = documentId;
    this.send('join-document', { documentId, user });
  }

  public leaveDocument(documentId: string): void {
    this.send('leave-document', { documentId });
    if (this.currentRoom === documentId) {
      this.currentRoom = null;
    }
  }

  public sendDocumentChange(documentId: string, delta: any, blockId?: string): void {
    this.send('document-update', { documentId, delta, blockId });
  }

  public receiveDocumentChange(handler: (data: { delta: any; affectedBlockId?: string }) => void): () => void {
    return this.on('document-update', handler);
  }

  public sendCursorUpdate(documentId: string, cursor: CursorPosition): void {
    this.send('cursor-update', { documentId, cursor });
  }

  public receiveCursorUpdate(handler: (cursor: RemoteCursorState) => void): () => void {
    return this.on('remote-cursor', handler);
  }

  public sendPresenceUpdate(documentId: string, presence: Partial<PresenceUser>): void {
    this.send('presence-update', { documentId, presence });
  }

  public receivePresenceUpdate(handler: (users: PresenceUser[]) => void): () => void {
    return this.on('presence-sync', handler);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit(event: string, payload: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }

  private setStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.emit('status-change', newStatus);
  }

  private send(event: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    }
  }
}

export const collaborationService = new CollaborationService();
