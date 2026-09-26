import presenceManager from '../src/services/presenceManager.js';

describe('Real-Time Collaboration - Presence & Cursor Sync Suite', () => {
  beforeEach(() => {
    presenceManager.clearAll();
  });

  afterEach(() => {
    presenceManager.clearAll();
  });

  it('should maintain strict cross-document isolation for presence updates', () => {
    const docX = 'document-X';
    const docY = 'document-Y';

    const connA = 'conn-A';
    const connB = 'conn-B';
    const connC = 'conn-C';

    presenceManager.updatePresence(docX, connA, 'user-A', {
      blockId: 'block-1',
      cursor: { line: 10, column: 5 },
      selection: { start: 10, end: 15 },
    });

    presenceManager.updatePresence(docX, connB, 'user-B', {
      blockId: 'block-2',
      cursor: { line: 1, column: 0 },
    });

    presenceManager.updatePresence(docY, connC, 'user-C', {
      blockId: 'block-99',
      cursor: { line: 50, column: 20 },
    });

    // Doc X room presence contains A and B only
    const presenceX = presenceManager.getRoomPresence(docX);
    expect(presenceX.length).toBe(2);
    expect(presenceX.map((p) => p.connectionId)).toEqual(expect.arrayContaining([connA, connB]));
    expect(presenceX.map((p) => p.connectionId)).not.toContain(connC);

    // Doc Y room presence contains C only
    const presenceY = presenceManager.getRoomPresence(docY);
    expect(presenceY.length).toBe(1);
    expect(presenceY[0].connectionId).toBe(connC);
  });

  it('should sanitize secrets and sensitive fields from presence payloads', () => {
    const docId = 'document-sec';
    const connId = 'conn-sec';

    const rawPayload = {
      blockId: 'block-sec',
      cursor: { line: 5, column: 12 },
      selection: { start: 2, end: 8 },
      token: 'secret-bearer-token-12345',
      password: 'super-secret-password',
      authorization: 'Bearer secret',
    };

    const sanitized = presenceManager.updatePresence(docId, connId, 'user-1', rawPayload);
    expect(sanitized).toBeDefined();
    expect(sanitized.connectionId).toBe(connId);
    expect(sanitized.userId).toBe('user-1');
    expect(sanitized.blockId).toBe('block-sec');
    expect(sanitized.cursor).toEqual({ line: 5, column: 12, index: 0 });
    expect(sanitized.selection).toEqual({ start: 2, end: 8 });

    // Assert sensitive fields are stripped
    expect(sanitized.token).toBeUndefined();
    expect(sanitized.password).toBeUndefined();
    expect(sanitized.authorization).toBeUndefined();
  });

  it('should correctly round-trip cursor and selection values', () => {
    const docId = 'document-rt';
    const connId = 'conn-rt';

    presenceManager.updatePresence(docId, connId, 'user-rt', {
      blockId: 'block-alpha',
      cursor: { line: 42, column: 17, index: 205 },
      selection: { start: 200, end: 215 },
    });

    const roomPresence = presenceManager.getRoomPresence(docId);
    expect(roomPresence.length).toBe(1);
    const p = roomPresence[0];
    expect(p.blockId).toBe('block-alpha');
    expect(p.cursor).toEqual({ line: 42, column: 17, index: 205 });
    expect(p.selection).toEqual({ start: 200, end: 215 });
  });

  it('should remove presence on disconnect', () => {
    const docId = 'document-disc';
    const connA = 'conn-A';
    const connB = 'conn-B';

    presenceManager.updatePresence(docId, connA, 'user-A', { blockId: 'b1' });
    presenceManager.updatePresence(docId, connB, 'user-B', { blockId: 'b2' });

    expect(presenceManager.getRoomPresence(docId).length).toBe(2);

    // Simulate disconnect of Client A
    presenceManager.removePresence(docId, connA);

    const updatedPresence = presenceManager.getRoomPresence(docId);
    expect(updatedPresence.length).toBe(1);
    expect(updatedPresence[0].connectionId).toBe(connB);
  });

  it('should reject malformed presence payloads without crashing', () => {
    const docId = 'document-mal';
    const connId = 'conn-mal';

    const malformed = [
      null,
      undefined,
      'string-instead-of-object',
      12345,
    ];

    for (const bad of malformed) {
      expect(() => {
        const res = presenceManager.updatePresence(docId, connId, 'user-bad', bad);
        expect(res).toBeNull();
      }).not.toThrow();
    }
  });

  it('should throttle presence updates while delivering the final state correctly', async () => {
    const docId = 'document-throttle';
    const connId = 'conn-th';
    const broadcasts = [];

    const broadcastCb = (presence) => {
      broadcasts.push({ ...presence });
    };

    // Burst 5 rapid updates
    for (let i = 1; i <= 5; i++) {
      presenceManager.updatePresenceThrottled(
        docId,
        connId,
        'user-th',
        { blockId: `b${i}`, cursor: { line: i, column: i } },
        broadcastCb
      );
    }

    // Immediate broadcast delivered the 1st update
    expect(broadcasts.length).toBe(1);
    expect(broadcasts[0].blockId).toBe('b1');

    // Wait for throttle timer to fire (> 50ms)
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Trailing broadcast must deliver the 5th (final) update
    expect(broadcasts.length).toBe(2);
    expect(broadcasts[1].blockId).toBe('b5');
    expect(broadcasts[1].cursor).toEqual({ line: 5, column: 5, index: 0 });
  });
});
