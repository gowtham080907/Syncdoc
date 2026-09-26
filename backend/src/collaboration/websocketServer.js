import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import docManager from '../services/collaborativeDocumentManager.js';
import lockManager from '../services/blockLockManager.js';
import presenceManager from '../services/presenceManager.js';

const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB size limit

/**
 * Initializes and manages the real-time WebSocket Collaboration Server.
 */
export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws/collaboration',
    maxPayload: MAX_MESSAGE_SIZE,
  });

  // Map<connectionId, { ws: WebSocket, userId: string|null, rooms: Set<string> }>
  const connections = new Map();

  /**
   * Helper to send JSON payload to a socket safely.
   */
  function safeSend(ws, payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
        ws.send(data);
      } catch (err) {
        logger.error(`Failed to send WebSocket message: ${err.message}`);
      }
    }
  }

  /**
   * Helper to broadcast JSON payload to all connected clients in a document room.
   * @param {string} documentId 
   * @param {object} payload 
   * @param {string|null} excludeConnectionId 
   */
  function broadcastToRoom(documentId, payload, excludeConnectionId = null) {
    const data = JSON.stringify(payload);
    for (const [connId, conn] of connections.entries()) {
      if (excludeConnectionId && connId === excludeConnectionId) continue;
      if (conn.rooms.has(documentId) && conn.ws.readyState === WebSocket.OPEN) {
        try {
          conn.ws.send(data);
        } catch (err) {
          logger.error(`Error broadcasting to connection ${connId}: ${err.message}`);
        }
      }
    }
  }

  /**
   * Parse token from URL query string or message payload.
   */
  function authenticateToken(tokenStr) {
    if (!tokenStr) return null;
    try {
      const decoded = jwt.verify(tokenStr, config.jwtSecret);
      return decoded ? { id: decoded.id, email: decoded.email } : null;
    } catch (err) {
      return null;
    }
  }

  wss.on('connection', (ws, req) => {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Parse token from query string if present: e.g. /ws/collaboration?token=xyz
    let authUser = null;
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const tokenParam = url.searchParams.get('token');
      if (tokenParam) {
        authUser = authenticateToken(tokenParam);
      }
    } catch (err) {
      // Ignore URL parsing errors
    }

    const conn = {
      ws,
      connectionId,
      userId: authUser ? authUser.id : null,
      rooms: new Set(),
    };
    connections.set(connectionId, conn);

    logger.info(`WebSocket client connected: ${connectionId} (User: ${conn.userId || 'anonymous'})`);

    ws.on('message', (message, isBinary) => {
      try {
        let msg = null;

        if (isBinary) {
          // Handle direct raw binary update frames if structured as binary
          logger.warn(`Received raw binary frame on connection ${connectionId}`);
          return;
        }

        const text = typeof message === 'string' ? message : message.toString('utf8');
        if (text.length > MAX_MESSAGE_SIZE) {
          safeSend(ws, { type: 'error', code: 'PAYLOAD_TOO_LARGE', message: 'Message payload exceeds limit' });
          return;
        }

        // Prototype pollution check on raw text before parsing
        if (text.includes('__proto__') || text.includes('constructor') || text.includes('prototype')) {
          safeSend(ws, { type: 'error', code: 'INVALID_INPUT', message: 'Invalid payload key detected' });
          return;
        }

        try {
          msg = JSON.parse(text);
        } catch (e) {
          safeSend(ws, { type: 'error', code: 'INVALID_JSON', message: 'Malformed JSON payload' });
          return;
        }

        if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
          safeSend(ws, { type: 'error', code: 'INVALID_MESSAGE', message: 'Message must be a valid object' });
          return;
        }

        const { type, documentId } = msg;

        // If message includes auth token and socket isn't authenticated yet, authenticate
        if (msg.token && !conn.userId) {
          const verified = authenticateToken(msg.token);
          if (verified) {
            conn.userId = verified.id;
          }
        }

        switch (type) {
          case 'join': {
            if (!documentId || typeof documentId !== 'string') {
              safeSend(ws, { type: 'error', code: 'INVALID_DOCUMENT_ID', message: 'documentId required' });
              return;
            }

            conn.rooms.add(documentId);
            docManager.trackSession(documentId, connectionId);

            // Send full initial doc state to client
            const stateUpdate = docManager.getDocState(documentId);
            const base64Update = Buffer.from(stateUpdate).toString('base64');
            safeSend(ws, {
              type: 'sync-state',
              documentId,
              update: base64Update,
            });

            // Send current presence list to client
            safeSend(ws, {
              type: 'presence-list',
              documentId,
              presences: presenceManager.getRoomPresence(documentId),
            });
            break;
          }

          case 'leave': {
            if (!documentId || typeof documentId !== 'string') return;
            conn.rooms.delete(documentId);
            docManager.removeSession(documentId, connectionId);
            presenceManager.removePresence(documentId, connectionId);
            lockManager.releaseClientLocks(documentId, connectionId);

            broadcastToRoom(documentId, {
              type: 'presence-removed',
              documentId,
              connectionId,
            });
            break;
          }

          case 'update': {
            if (!documentId || typeof documentId !== 'string' || !conn.rooms.has(documentId)) {
              safeSend(ws, { type: 'error', code: 'NOT_IN_ROOM', message: 'Client must join room before sending updates' });
              return;
            }

            if (!msg.update) {
              safeSend(ws, { type: 'error', code: 'INVALID_UPDATE', message: 'Update delta required' });
              return;
            }

            let updateBuf;
            if (typeof msg.update === 'string') {
              updateBuf = Buffer.from(msg.update, 'base64');
            } else if (Array.isArray(msg.update)) {
              updateBuf = Buffer.from(msg.update);
            } else {
              safeSend(ws, { type: 'error', code: 'INVALID_UPDATE_FORMAT', message: 'Update must be base64 or byte array' });
              return;
            }

            const applied = docManager.applyUpdate(documentId, updateBuf);
            if (!applied) {
              safeSend(ws, { type: 'error', code: 'CORRUPTED_DELTA', message: 'Failed to apply Yjs delta' });
              return;
            }

            // Broadcast delta update to all other clients in room
            broadcastToRoom(documentId, {
              type: 'update',
              documentId,
              update: typeof msg.update === 'string' ? msg.update : updateBuf.toString('base64'),
              senderId: connectionId,
            }, connectionId);
            break;
          }

          case 'lock-acquire': {
            if (!documentId || typeof documentId !== 'string' || !msg.blockId || typeof msg.blockId !== 'string') {
              safeSend(ws, { type: 'error', code: 'INVALID_LOCK_REQ', message: 'documentId and blockId required' });
              return;
            }

            const result = lockManager.acquireBlockLock(documentId, msg.blockId, connectionId, msg.ttlMs);
            safeSend(ws, {
              type: 'lock-ack',
              documentId,
              blockId: msg.blockId,
              success: result.success,
              lock: result.lock,
              reason: result.reason,
            });

            if (result.success) {
              broadcastToRoom(documentId, {
                type: 'lock-changed',
                documentId,
                blockId: msg.blockId,
                lock: result.lock,
              }, connectionId);
            }
            break;
          }

          case 'lock-release': {
            if (!documentId || typeof documentId !== 'string' || !msg.blockId || typeof msg.blockId !== 'string') {
              safeSend(ws, { type: 'error', code: 'INVALID_LOCK_REQ', message: 'documentId and blockId required' });
              return;
            }

            const result = lockManager.releaseBlockLock(documentId, msg.blockId, connectionId);
            safeSend(ws, {
              type: 'lock-release-ack',
              documentId,
              blockId: msg.blockId,
              success: result.success,
              reason: result.reason,
            });

            if (result.success) {
              broadcastToRoom(documentId, {
                type: 'lock-released',
                documentId,
                blockId: msg.blockId,
                clientId: connectionId,
              }, connectionId);
            }
            break;
          }

          case 'presence-update': {
            if (!documentId || typeof documentId !== 'string' || !conn.rooms.has(documentId)) {
              safeSend(ws, { type: 'error', code: 'NOT_IN_ROOM', message: 'Client must join room before presence update' });
              return;
            }

            presenceManager.updatePresenceThrottled(
              documentId,
              connectionId,
              conn.userId,
              msg,
              (finalPresence) => {
                broadcastToRoom(documentId, {
                  type: 'presence-update',
                  documentId,
                  presence: finalPresence,
                });
              }
            );
            break;
          }

          default:
            safeSend(ws, { type: 'error', code: 'UNKNOWN_MESSAGE_TYPE', message: `Unknown type: ${type}` });
            break;
        }
      } catch (err) {
        logger.error(`Error processing WebSocket message from ${connectionId}: ${err.message}`);
        safeSend(ws, { type: 'error', code: 'SERVER_ERROR', message: 'Internal server error processing message' });
      }
    });

    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${connectionId}`);

      // Clean up all joined rooms, locks, and presences for connectionId
      for (const docId of conn.rooms) {
        docManager.removeSession(docId, connectionId);
        presenceManager.removePresence(docId, connectionId);

        broadcastToRoom(docId, {
          type: 'presence-removed',
          documentId: docId,
          connectionId,
        });
      }

      // Release all block locks owned by connectionId
      const releasedLocksMap = lockManager.releaseAllLocksForClient(connectionId);
      for (const [docId, blockIds] of releasedLocksMap.entries()) {
        for (const blockId of blockIds) {
          broadcastToRoom(docId, {
            type: 'lock-released',
            documentId: docId,
            blockId,
            clientId: connectionId,
          });
        }
      }

      connections.delete(connectionId);
    });

    ws.on('error', (err) => {
      logger.error(`WebSocket connection error on ${connectionId}: ${err.message}`);
    });
  });

  return wss;
}
