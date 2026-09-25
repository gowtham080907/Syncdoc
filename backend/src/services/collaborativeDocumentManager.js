import * as Y from 'yjs';
import logger from '../utils/logger.js';

/**
 * CollaborativeDocumentManager
 * 
 * Manages in-memory Yjs documents (Y.Doc) isolated by documentId.
 * No persistence to Mongo - all state is in-memory as per backend collaboration spec.
 */
export class CollaborativeDocumentManager {
  constructor() {
    // Map<documentId, { doc: Y.Doc, activeClients: Set<string>, lastActivity: number }>
    this.rooms = new Map();
  }

  /**
   * Rejects prototype pollution keys or invalid documentId types.
   */
  _validateDocumentId(documentId) {
    if (!documentId || typeof documentId !== 'string') {
      throw new Error('Invalid document ID: must be a non-empty string');
    }
    if (documentId === '__proto__' || documentId === 'constructor' || documentId === 'prototype') {
      throw new Error('Invalid document ID: prototype pollution attempt detected');
    }
  }

  /**
   * Get existing Y.Doc for documentId or create a new one.
   * @param {string} documentId 
   * @returns {Y.Doc}
   */
  getOrCreateDoc(documentId) {
    this._validateDocumentId(documentId);
    let room = this.rooms.get(documentId);
    if (!room) {
      room = {
        doc: new Y.Doc(),
        activeClients: new Set(),
        lastActivity: Date.now(),
      };
      this.rooms.set(documentId, room);
    }
    room.lastActivity = Date.now();
    return room.doc;
  }

  /**
   * Apply a Yjs update delta to the document.
   * Rejects malformed updates without crashing or corrupting the Y.Doc.
   * 
   * @param {string} documentId 
   * @param {Uint8Array|Buffer} update 
   * @returns {boolean} true if update was valid & applied, false if malformed
   */
  applyUpdate(documentId, update) {
    this._validateDocumentId(documentId);
    if (!update || !(update instanceof Uint8Array || Buffer.isBuffer(update))) {
      logger.warn(`Malformed Yjs update ignored for doc ${documentId}: not a Uint8Array or Buffer`);
      return false;
    }

    const doc = this.getOrCreateDoc(documentId);
    try {
      // Y.applyUpdate applies delta in-place; throws if update binary format is invalid
      Y.applyUpdate(doc, new Uint8Array(update));
      const room = this.rooms.get(documentId);
      if (room) {
        room.lastActivity = Date.now();
      }
      return true;
    } catch (err) {
      logger.warn(`Failed to apply malformed Yjs update to doc ${documentId}: ${err.message}`);
      return false;
    }
  }

  /**
   * Encodes current Y.Doc state as a Yjs update delta.
   * @param {string} documentId 
   * @returns {Uint8Array}
   */
  getDocState(documentId) {
    const doc = this.getOrCreateDoc(documentId);
    return Y.encodeStateAsUpdate(doc);
  }

  /**
   * Tracks client connection in a room.
   * @param {string} documentId 
   * @param {string} clientId 
   */
  trackSession(documentId, clientId) {
    this._validateDocumentId(documentId);
    if (!clientId || typeof clientId !== 'string') {
      throw new Error('Invalid client ID');
    }
    const doc = this.getOrCreateDoc(documentId);
    const room = this.rooms.get(documentId);
    room.activeClients.add(clientId);
    room.lastActivity = Date.now();
  }

  /**
   * Removes client connection from a room.
   * @param {string} documentId 
   * @param {string} clientId 
   */
  removeSession(documentId, clientId) {
    if (!documentId || typeof documentId !== 'string') return;
    const room = this.rooms.get(documentId);
    if (room) {
      room.activeClients.delete(clientId);
      room.lastActivity = Date.now();
    }
  }

  /**
   * Get count of connected clients in a document room.
   * @param {string} documentId 
   * @returns {number}
   */
  getConnectedClientsCount(documentId) {
    const room = this.rooms.get(documentId);
    return room ? room.activeClients.size : 0;
  }

  /**
   * Check if a room exists for documentId.
   * @param {string} documentId 
   * @returns {boolean}
   */
  hasRoom(documentId) {
    return this.rooms.has(documentId);
  }

  /**
   * Evict inactive rooms with 0 connected clients older than maxAgeMs.
   * @param {number} maxAgeMs - default 30 mins (1800000ms)
   */
  evictInactiveRooms(maxAgeMs = 1800000) {
    const now = Date.now();
    for (const [documentId, room] of this.rooms.entries()) {
      if (room.activeClients.size === 0 && (now - room.lastActivity) > maxAgeMs) {
        room.doc.destroy();
        this.rooms.delete(documentId);
        logger.info(`Evicted inactive collaboration room for doc ${documentId}`);
      }
    }
  }

  /**
   * Resets all rooms (mainly for testing).
   */
  clearAll() {
    for (const room of this.rooms.values()) {
      room.doc.destroy();
    }
    this.rooms.clear();
  }
}

export default new CollaborativeDocumentManager();
