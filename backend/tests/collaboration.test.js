import http from 'http';
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import config from '../src/config/env.js';
import { setupWebSocketServer } from '../src/collaboration/websocketServer.js';
import docManager from '../src/services/collaborativeDocumentManager.js';
import lockManager from '../src/services/blockLockManager.js';
import presenceManager from '../src/services/presenceManager.js';
import * as Y from 'yjs';

describe('Real-Time Collaboration - End-to-End WebSocket Server Integration', () => {
  let server;
  let wss;
  let port;
  let validToken;
  const activeSockets = new Set();

  beforeAll((done) => {
    validToken = jwt.sign({ id: 'user_101', email: 'test@syncdoc.com' }, config.jwtSecret);
    server = http.createServer(app);
    wss = setupWebSocketServer(server);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    for (const ws of activeSockets) {
      try { ws.terminate(); } catch (e) {}
    }
    activeSockets.clear();
    if (wss) wss.close();
    if (server) server.close(done);
    else done();
  });

  beforeEach(() => {
    docManager.clearAll();
    lockManager.clearAll();
    presenceManager.clearAll();
  });

  afterEach(() => {
    docManager.clearAll();
    lockManager.clearAll();
    presenceManager.clearAll();
  });

  function delay(ms = 20) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function connectClient(token = validToken) {
    return new Promise((resolve, reject) => {
      const url = `ws://localhost:${port}/ws/collaboration?token=${encodeURIComponent(token)}`;
      const rawWs = new WebSocket(url);
      activeSockets.add(rawWs);

      const queue = [];
      const listeners = [];

      rawWs.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString('utf8'));
          for (let i = 0; i < listeners.length; i++) {
            if (listeners[i].filterFn(msg)) {
              const item = listeners.splice(i, 1)[0];
              clearTimeout(item.timer);
              return item.resolve(msg);
            }
          }
          queue.push(msg);
        } catch (e) {}
      });

      const client = {
        rawWs,
        send(obj) {
          rawWs.send(typeof obj === 'string' ? obj : JSON.stringify(obj));
        },
        waitForMessage(filterFn, timeoutMs = 3000) {
          const idx = queue.findIndex(filterFn);
          if (idx !== -1) {
            return Promise.resolve(queue.splice(idx, 1)[0]);
          }
          return new Promise((res, rej) => {
            const timer = setTimeout(() => {
              const lIdx = listeners.findIndex((l) => l.resolve === res);
              if (lIdx !== -1) listeners.splice(lIdx, 1);
              rej(new Error(`Timeout waiting for WebSocket message matching predicate`));
            }, timeoutMs);
            listeners.push({ filterFn, resolve: res, timer });
          });
        },
        getAllReceivedMessages() {
          return [...queue];
        },
        close() {
          rawWs.close();
        },
      };

      rawWs.on('open', () => resolve(client));
      rawWs.on('error', (err) => reject(err));
      rawWs.on('close', () => activeSockets.delete(rawWs));
    });
  }

  it('Pass Condition §2: Two connected clients in Document X converge; Client C in Document Y receives NO traffic', async () => {
    const docX = 'document-X-room';
    const docY = 'document-Y-room';

    const clientA = await connectClient();
    const clientB = await connectClient();
    const clientC = await connectClient();

    // Client A joins Document X
    clientA.send({ type: 'join', documentId: docX });
    await clientA.waitForMessage((m) => m.type === 'sync-state' && m.documentId === docX);

    // Client B joins Document X
    clientB.send({ type: 'join', documentId: docX });
    await clientB.waitForMessage((m) => m.type === 'sync-state' && m.documentId === docX);

    // Client C joins Document Y
    clientC.send({ type: 'join', documentId: docY });
    await clientC.waitForMessage((m) => m.type === 'sync-state' && m.documentId === docY);

    await delay(30); // Ensure room joins are fully acknowledged by server

    // Client A creates a local edit and sends update delta to docX
    const ydocA = new Y.Doc();
    const textA = ydocA.getText('content');
    let deltaA;
    ydocA.on('update', (u) => { deltaA = u; });
    textA.insert(0, 'Hello from Client A in Doc X!');

    // Send update from Client A
    clientA.send({
      type: 'update',
      documentId: docX,
      update: Buffer.from(deltaA).toString('base64'),
    });

    const updateMsg = await clientB.waitForMessage((m) => m.type === 'update' && m.documentId === docX);
    expect(updateMsg).toBeDefined();

    // Apply update to Client B's local replica
    const ydocB = new Y.Doc();
    Y.applyUpdate(ydocB, Buffer.from(updateMsg.update, 'base64'));
    expect(ydocB.getText('content').toString()).toBe('Hello from Client A in Doc X!');

    // Client C in Document Y must NOT receive any message related to docX
    const crossDocMessages = clientC.getAllReceivedMessages().filter((m) => m.documentId === docX);
    expect(crossDocMessages.length).toBe(0);

    clientA.close();
    clientB.close();
    clientC.close();
  });

  it('Pass Condition §5: Presence & cursor sync across room with disconnect removal', async () => {
    const docX = 'document-presence-test';
    const docY = 'document-isolated-presence';

    const clientA = await connectClient();
    const clientB = await connectClient();
    const clientC = await connectClient();

    // Join rooms sequentially and wait for sync-state
    clientA.send({ type: 'join', documentId: docX });
    await clientA.waitForMessage((m) => m.type === 'sync-state' && m.documentId === docX);

    clientB.send({ type: 'join', documentId: docX });
    await clientB.waitForMessage((m) => m.type === 'sync-state' && m.documentId === docX);

    clientC.send({ type: 'join', documentId: docY });
    await clientC.waitForMessage((m) => m.type === 'sync-state' && m.documentId === docY);

    await delay(30); // Ensure room joins settle on server

    // Client A updates cursor in Doc X
    clientA.send({
      type: 'presence-update',
      documentId: docX,
      blockId: 'block-10',
      cursor: { line: 5, column: 12 },
      selection: { start: 1, end: 4 },
    });

    const presenceMsg = await clientB.waitForMessage((m) => m.type === 'presence-update' && m.documentId === docX);
    expect(presenceMsg.presence.cursor).toEqual({ line: 5, column: 12, index: 0 });
    expect(presenceMsg.presence.blockId).toBe('block-10');

    // Client C in docY receives NONE of it
    expect(clientC.getAllReceivedMessages().filter((m) => m.documentId === docX).length).toBe(0);

    // Client A disconnects -> B receives presence-removed event
    clientA.close();
    const removalMsg = await clientB.waitForMessage((m) => m.type === 'presence-removed' && m.documentId === docX);
    expect(removalMsg.documentId).toBe(docX);

    clientB.close();
    clientC.close();
  });

  it('Pass Condition §3: Malformed update rejected without server crash or Y.Doc corruption', async () => {
    const docId = 'doc-malformed-ws';
    const clientA = await connectClient();

    clientA.send({ type: 'join', documentId: docId });
    await clientA.waitForMessage((m) => m.type === 'sync-state' && m.documentId === docId);

    // Send malformed non-base64 update frame
    clientA.send({
      type: 'update',
      documentId: docId,
      update: '!!!NOT_VALID_BASE64_OR_YJS_DELTA!!!',
    });

    const errMsg = await clientA.waitForMessage((m) => m.type === 'error');
    expect(errMsg.code).toBe('CORRUPTED_DELTA');

    // Server stays responsive and Y.Doc is intact
    expect(docManager.hasRoom(docId)).toBe(true);

    clientA.close();
  });
});
