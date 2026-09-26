import logger from '../utils/logger.js';

/**
 * PresenceManager
 * 
 * Tracks real-time presence and cursor positions per document room.
 * Ensures cross-document isolation, secret sanitization, disconnect cleanup,
 * and throttled broadcast management without dropping final updates.
 */
export class PresenceManager {
  constructor(throttleMs = 50) {
    // Map<documentId, Map<connectionId, PresenceState>>
    this.presenceMap = new Map();
    // Map<connectionId, { timer: NodeJS.Timeout, pendingState: PresenceState }>
    this.throttleTimers = new Map();
    this.throttleMs = throttleMs;
  }

  /**
   * Sanitizes presence payload to prevent leaking auth secrets, tokens, or arbitrary object injection.
   */
  _sanitizePresence(rawPresence, connectionId, userId, documentId) {
    if (!rawPresence || typeof rawPresence !== 'object') {
      return null;
    }

    const cursor = (rawPresence.cursor !== undefined && rawPresence.cursor !== null && typeof rawPresence.cursor === 'object')
      ? { line: Number(rawPresence.cursor.line) || 0, column: Number(rawPresence.cursor.column) || 0, index: Number(rawPresence.cursor.index) || 0 }
      : (typeof rawPresence.cursor === 'number' ? rawPresence.cursor : null);

    const selection = (rawPresence.selection !== undefined && rawPresence.selection !== null && typeof rawPresence.selection === 'object')
      ? { start: Number(rawPresence.selection.start) || 0, end: Number(rawPresence.selection.end) || 0 }
      : null;

    const blockId = (typeof rawPresence.blockId === 'string' && rawPresence.blockId !== '__proto__' && rawPresence.blockId !== 'constructor')
      ? rawPresence.blockId
      : null;

    return {
      connectionId,
      userId: userId || rawPresence.userId || null,
      documentId,
      blockId,
      cursor,
      selection,
      connectionStatus: rawPresence.connectionStatus || 'active',
      updatedAt: Date.now(),
    };
  }

  /**
   * Update or set presence state for a connection in a document room.
   * Rejects malformed presence objects without crashing.
   * 
   * @param {string} documentId 
   * @param {string} connectionId 
   * @param {string|null} userId 
   * @param {object} rawPresence 
   * @returns {object|null} Sanitized presence state if updated, null if rejected/malformed
   */
  updatePresence(documentId, connectionId, userId, rawPresence) {
    if (!documentId || typeof documentId !== 'string' || !connectionId || typeof connectionId !== 'string') {
      logger.warn('Malformed presence update ignored: missing valid documentId or connectionId');
      return null;
    }

    const sanitized = this._sanitizePresence(rawPresence, connectionId, userId, documentId);
    if (!sanitized) {
      logger.warn(`Malformed presence update rejected for connection ${connectionId} in doc ${documentId}`);
      return null;
    }

    let roomPresence = this.presenceMap.get(documentId);
    if (!roomPresence) {
      roomPresence = new Map();
      this.presenceMap.set(documentId, roomPresence);
    }

    roomPresence.set(connectionId, sanitized);
    return sanitized;
  }

  /**
   * Remove presence state for a connection in a document room.
   * Also clears any pending throttle timers.
   * 
   * @param {string} documentId 
   * @param {string} connectionId 
   */
  removePresence(documentId, connectionId) {
    if (this.throttleTimers.has(connectionId)) {
      clearTimeout(this.throttleTimers.get(connectionId).timer);
      this.throttleTimers.delete(connectionId);
    }

    if (!documentId || !connectionId) return;

    const roomPresence = this.presenceMap.get(documentId);
    if (roomPresence) {
      roomPresence.delete(connectionId);
      if (roomPresence.size === 0) {
        this.presenceMap.delete(documentId);
      }
    }
  }

  /**
   * Get all active presences for a document room.
   * Returns empty array for non-existent documents.
   * 
   * @param {string} documentId 
   * @returns {object[]}
   */
  getRoomPresence(documentId) {
    if (!documentId || typeof documentId !== 'string') return [];
    const roomPresence = this.presenceMap.get(documentId);
    if (!roomPresence) return [];
    return Array.from(roomPresence.values());
  }

  /**
   * Throttles presence updates per connection to avoid overwhelming broadcasts,
   * while guaranteeing that the latest final state is executed.
   * 
   * @param {string} documentId 
   * @param {string} connectionId 
   * @param {string|null} userId 
   * @param {object} rawPresence 
   * @param {function} broadcastCb - Callback invoked with final sanitized presence
   */
  updatePresenceThrottled(documentId, connectionId, userId, rawPresence, broadcastCb) {
    const sanitized = this._sanitizePresence(rawPresence, connectionId, userId, documentId);
    if (!sanitized) return;

    // Apply immediate internal state update
    this.updatePresence(documentId, connectionId, userId, rawPresence);

    const existing = this.throttleTimers.get(connectionId);
    if (existing) {
      // Update pending state to guarantee latest state is broadcast when timer fires
      existing.pendingState = sanitized;
      return;
    }

    // Execute initial broadcast immediately
    try {
      broadcastCb(sanitized);
    } catch (err) {
      logger.error(`Error in presence broadcast callback: ${err.message}`);
    }

    // Set trailing timer to capture any intermediate state updates
    const timer = setTimeout(() => {
      const pending = this.throttleTimers.get(connectionId);
      this.throttleTimers.delete(connectionId);

      if (pending && pending.pendingState) {
        try {
          broadcastCb(pending.pendingState);
        } catch (err) {
          logger.error(`Error in trailing presence broadcast callback: ${err.message}`);
        }
      }
    }, this.throttleMs);

    this.throttleTimers.set(connectionId, { timer, pendingState: null });
  }

  /**
   * Resets all presence data (mainly for testing).
   */
  clearAll() {
    for (const item of this.throttleTimers.values()) {
      clearTimeout(item.timer);
    }
    this.throttleTimers.clear();
    this.presenceMap.clear();
  }
}

export default new PresenceManager();
