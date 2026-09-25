import * as Y from 'yjs';
import docManager from '../src/services/collaborativeDocumentManager.js';

describe('Real-Time Collaboration - Concurrency Suite', () => {
  beforeEach(() => {
    docManager.clearAll();
  });

  afterEach(() => {
    docManager.clearAll();
  });

  it('should achieve state convergence across ≥10 simulated clients editing concurrently with out-of-order deltas', () => {
    const documentId = 'concurrent-doc-101';
    const NUM_CLIENTS = 12;

    // Create 12 local Y.Doc client replicas
    const clientDocs = [];
    const clientTexts = [];
    for (let i = 0; i < NUM_CLIENTS; i++) {
      const doc = new Y.Doc();
      clientDocs.push(doc);
      clientTexts.push(doc.getText('content'));
    }

    // Each client generates local updates
    const allDeltas = [];

    // Track local updates on each doc
    const unbinds = clientDocs.map((doc, clientIndex) => {
      const handler = (update, origin) => {
        if (origin !== 'remote') {
          allDeltas.push({ clientIndex, update });
        }
      };
      doc.on('update', handler);
      return () => doc.off('update', handler);
    });

    // Each client inserts text into its local Y.Text instance
    for (let i = 0; i < NUM_CLIENTS; i++) {
      clientTexts[i].insert(clientTexts[i].length, ` [Client-${i}: payload-${i * 10}] `);
    }

    // Verify all 12 clients generated deltas
    expect(allDeltas.length).toBeGreaterThanOrEqual(NUM_CLIENTS);

    // Apply all deltas to server CollaborativeDocumentManager
    for (const deltaItem of allDeltas) {
      const applied = docManager.applyUpdate(documentId, deltaItem.update);
      expect(applied).toBe(true);
    }

    // Shuffle deltas to simulate out-of-order network delivery to all client replicas
    // Seeded/deterministic out-of-order shuffle
    const shuffledDeltas = [...allDeltas].reverse();

    // Deliver out-of-order deltas to each client replica via Yjs merge
    for (let i = 0; i < NUM_CLIENTS; i++) {
      const targetDoc = clientDocs[i];
      for (const deltaItem of shuffledDeltas) {
        Y.applyUpdate(targetDoc, deltaItem.update, 'remote');
      }
    }

    // Unbind update handlers
    unbinds.forEach((unbind) => unbind());

    // Verify that ALL 12 client replicas have converged to the EXACT same text content
    const expectedContent = clientTexts[0].toString();
    expect(expectedContent.length).toBeGreaterThan(0);

    for (let i = 1; i < NUM_CLIENTS; i++) {
      expect(clientTexts[i].toString()).toBe(expectedContent);
    }

    // Verify server Y.Doc also matches exact converged state
    const serverState = docManager.getDocState(documentId);
    const serverDoc = new Y.Doc();
    Y.applyUpdate(serverDoc, serverState);
    expect(serverDoc.getText('content').toString()).toBe(expectedContent);
  });
});
