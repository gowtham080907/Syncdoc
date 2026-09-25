import logger from '../utils/logger.js';

/**
 * BlockLockManager
 * 
 * Manages block-level locks for concurrent document editing.
 * Rules:
 * - Scoped per document + block + owning client.
 * - Conflicting lock attempts on the same block are rejected.
 * - Independent blocks in the same document can be locked concurrently.
 * - TTL-based lock expiration.
 * - Disconnect releases all locks owned by that client.
 * - Client cannot release another client's lock.
 * - Invalid IDs are rejected.
 */
export class BlockLockManager {
  constructor(defaultTtlMs = 30000) {
    // Map<documentId, Map<blockId, { clientId: string, acquiredAt: number, expiresAt: number }>>
    this.locks = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Validates documentId, blockId, and clientId to prevent prototype pollution or invalid input types.
   */
  _validateIds(documentId, blockId, clientId = null) {
    if (!documentId || typeof documentId !== 'string' || documentId.trim() === '') {
      throw new Error('Invalid document ID: must be a non-empty string');
    }
    if (documentId === '__proto__' || documentId === 'constructor' || documentId === 'prototype') {
      throw new Error('Invalid document ID: prototype pollution attempt');
    }

    if (!blockId || typeof blockId !== 'string' || blockId.trim() === '') {
      throw new Error('Invalid block ID: must be a non-empty string');
    }
    if (blockId === '__proto__' || blockId === 'constructor' || blockId === 'prototype') {
      throw new Error('Invalid block ID: prototype pollution attempt');
    }

    if (clientId !== null) {
      if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
        throw new Error('Invalid client ID: must be a non-empty string');
      }
      if (clientId === '__proto__' || clientId === 'constructor' || clientId === 'prototype') {
        throw new Error('Invalid client ID: prototype pollution attempt');
      }
    }
  }

  /**
   * Acquire a lock on a block within a document.
   * 
   * @param {string} documentId 
   * @param {string} blockId 
   * @param {string} clientId 
   * @param {number} ttlMs 
   * @returns {{ success: boolean, lock?: object, reason?: string }}
   */
  acquireBlockLock(documentId, blockId, clientId, ttlMs = this.defaultTtlMs) {
    this._validateIds(documentId, blockId, clientId);
    const now = Date.now();

    let docLocks = this.locks.get(documentId);
    if (!docLocks) {
      docLocks = new Map();
      this.locks.set(documentId, docLocks);
    }

    const currentLock = docLocks.get(blockId);

    // Check if locked by another client and not expired
    if (currentLock && currentLock.clientId !== clientId && currentLock.expiresAt > now) {
      return {
        success: false,
        reason: 'LOCKED',
        lock: { ...currentLock },
      };
    }

    // Acquire or renew lock
    const lock = {
      clientId,
      documentId,
      blockId,
      acquiredAt: now,
      expiresAt: now + (ttlMs || this.defaultTtlMs),
    };

    docLocks.set(blockId, lock);
    return {
      success: true,
      lock: { ...lock },
    };
  }

  /**
   * Release a lock on a block within a document.
   * A client cannot release another client's lock.
   * 
   * @param {string} documentId 
   * @param {string} blockId 
   * @param {string} clientId 
   * @returns {{ success: boolean, reason?: string }}
   */
  releaseBlockLock(documentId, blockId, clientId) {
    this._validateIds(documentId, blockId, clientId);
    const now = Date.now();

    const docLocks = this.locks.get(documentId);
    if (!docLocks) {
      return { success: true }; // Idempotent success if no locks exist for doc
    }

    const currentLock = docLocks.get(blockId);
    if (!currentLock) {
      return { success: true }; // Idempotent success if block not locked
    }

    // Check ownership: A client cannot release another client's lock (unless expired)
    if (currentLock.clientId !== clientId && currentLock.expiresAt > now) {
      return {
        success: false,
        reason: 'UNAUTHORIZED_RELEASE',
        message: `Client ${clientId} cannot release lock owned by ${currentLock.clientId}`,
      };
    }

    docLocks.delete(blockId);
    if (docLocks.size === 0) {
      this.locks.delete(documentId);
    }

    return { success: true };
  }

  /**
   * Get active lock for a block. Returns null if free or expired.
   * 
   * @param {string} documentId 
   * @param {string} blockId 
   * @returns {object|null}
   */
  getBlockLock(documentId, blockId) {
    this._validateIds(documentId, blockId);
    const now = Date.now();

    const docLocks = this.locks.get(documentId);
    if (!docLocks) return null;

    const lock = docLocks.get(blockId);
    if (!lock) return null;

    if (lock.expiresAt <= now) {
      // Lock expired, clean up and return null
      docLocks.delete(blockId);
      if (docLocks.size === 0) {
        this.locks.delete(documentId);
      }
      return null;
    }

    return { ...lock };
  }

  /**
   * Release all locks held by a client within a specific document (e.g. on disconnect or leave).
   * 
   * @param {string} documentId 
   * @param {string} clientId 
   * @returns {string[]} List of blockIds released
   */
  releaseClientLocks(documentId, clientId) {
    if (!documentId || !clientId) return [];
    const docLocks = this.locks.get(documentId);
    if (!docLocks) return [];

    const releasedBlockIds = [];
    for (const [blockId, lock] of docLocks.entries()) {
      if (lock.clientId === clientId) {
        docLocks.delete(blockId);
        releasedBlockIds.push(blockId);
      }
    }

    if (docLocks.size === 0) {
      this.locks.delete(documentId);
    }

    return releasedBlockIds;
  }

  /**
   * Release all locks held by a client across all documents (e.g. on global disconnect).
   * 
   * @param {string} clientId 
   * @returns {Map<string, string[]>} Map of documentId -> released blockIds
   */
  releaseAllLocksForClient(clientId) {
    if (!clientId) return new Map();
    const released = new Map();

    for (const [documentId, docLocks] of this.locks.entries()) {
      const releasedBlocks = [];
      for (const [blockId, lock] of docLocks.entries()) {
        if (lock.clientId === clientId) {
          docLocks.delete(blockId);
          releasedBlocks.push(blockId);
        }
      }
      if (releasedBlocks.length > 0) {
        released.set(documentId, releasedBlocks);
      }
      if (docLocks.size === 0) {
        this.locks.delete(documentId);
      }
    }

    return released;
  }

  /**
   * Clear all locks (mainly for testing).
   */
  clearAll() {
    this.locks.clear();
  }
}

export default new BlockLockManager();
