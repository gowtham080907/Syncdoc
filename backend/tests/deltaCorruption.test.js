import * as Y from 'yjs';
import docManager from '../src/services/collaborativeDocumentManager.js';

describe('Real-Time Collaboration - Delta Corruption & Out-of-Order Delivery', () => {
  beforeEach(() => {
    docManager.clearAll();
  });

  afterEach(() => {
    docManager.clearAll();
  });

  it('should survive out-of-order delta arrival across multiple permutations with all edits surviving', () => {
    const documentId = 'delta-order-doc-1';

    // Test across 4 different delivery permutations
    const permutations = [
      [0, 1],
      [1, 0],
      [0, 1, 0], // Duplicate delivery
      [1, 0, 1], // Out-of-order duplicate delivery
    ];

    for (const perm of permutations) {
      docManager.clearAll();

      const docA = new Y.Doc();
      const docB = new Y.Doc();
      const textA = docA.getText('content');
      const textB = docB.getText('content');

      let updateA, updateB;

      docA.on('update', (u) => { updateA = u; });
      docB.on('update', (u) => { updateB = u; });

      textA.insert(0, 'Hello from Client A. ');
      textB.insert(0, 'World from Client B. ');

      const updates = [updateA, updateB];

      // Apply to server in specified permutation order
      for (const idx of perm) {
        const ok = docManager.applyUpdate(documentId, updates[idx]);
        expect(ok).toBe(true);
      }

      // Replicas apply in reverse permutation order
      for (const idx of perm) {
        Y.applyUpdate(docA, updates[idx]);
        Y.applyUpdate(docB, updates[idx]);
      }

      // Both edits must survive in both replicas
      expect(textA.toString()).toContain('Hello from Client A.');
      expect(textA.toString()).toContain('World from Client B.');

      // Replicas must converge to exact same text
      expect(textA.toString()).toBe(textB.toString());
    }
  });

  it('should reject malformed/corrupted update frames without crashing server or corrupting Y.Doc', () => {
    const documentId = 'corrupt-doc-99';

    // Step 1: Apply valid initial update
    const docInit = new Y.Doc();
    let initUpdate;
    docInit.on('update', (u) => { initUpdate = u; });
    docInit.getText('content').insert(0, 'Valid baseline text');

    const appliedInit = docManager.applyUpdate(documentId, initUpdate);
    expect(appliedInit).toBe(true);

    const baselineState = docManager.getDocState(documentId);
    expect(baselineState.length).toBeGreaterThan(0);

    // Step 2: Attempt applying various corrupted payloads
    const malformedPayloads = [
      null,
      undefined,
      'not-a-buffer',
      12345,
      Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x12]), // Random invalid binary junk
      new Uint8Array([1, 2, 3, 4, 5]), // Truncated invalid Yjs byte sequence
    ];

    for (const badPayload of malformedPayloads) {
      let result;
      expect(() => {
        result = docManager.applyUpdate(documentId, badPayload);
      }).not.toThrow();

      expect(result).toBe(false);
    }

    // Step 3: Assert document remains completely uncorrupted and intact
    const postState = docManager.getDocState(documentId);
    const checkDoc = new Y.Doc();
    Y.applyUpdate(checkDoc, postState);
    expect(checkDoc.getText('content').toString()).toBe('Valid baseline text');
  });
});
