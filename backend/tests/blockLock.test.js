import lockManager, { BlockLockManager } from '../src/services/blockLockManager.js';

describe('Real-Time Collaboration - Block Lock Manager Suite', () => {
  beforeEach(() => {
    lockManager.clearAll();
  });

  afterEach(() => {
    lockManager.clearAll();
  });

  // Rule 1: Basic Acquire
  it('1. acquireBlockLock: should successfully acquire a lock on an un-locked block', () => {
    const docId = 'doc-1';
    const blockId = 'block-101';
    const clientId = 'client-A';

    const result = lockManager.acquireBlockLock(docId, blockId, clientId, 5000);
    expect(result.success).toBe(true);
    expect(result.lock).toBeDefined();
    expect(result.lock.clientId).toBe(clientId);
    expect(result.lock.documentId).toBe(docId);
    expect(result.lock.blockId).toBe(blockId);

    const activeLock = lockManager.getBlockLock(docId, blockId);
    expect(activeLock).toBeDefined();
    expect(activeLock.clientId).toBe(clientId);
  });

  // Rule 2: Conflicting Acquire Rejected
  it('2. conflicting acquire: should reject lock attempt on an already locked block by a different client', () => {
    const docId = 'doc-1';
    const blockId = 'block-101';
    const clientA = 'client-A';
    const clientB = 'client-B';

    // Client A acquires lock
    const resA = lockManager.acquireBlockLock(docId, blockId, clientA, 5000);
    expect(resA.success).toBe(true);

    // Client B attempts conflicting acquire
    const resB = lockManager.acquireBlockLock(docId, blockId, clientB, 5000);
    expect(resB.success).toBe(false);
    expect(resB.reason).toBe('LOCKED');
    expect(resB.lock.clientId).toBe(clientA);
  });

  // Rule 3: Different Blocks in Same Doc Can Be Locked Independently
  it('3. independent blocks: different blocks in the same document can be locked independently by different clients', () => {
    const docId = 'doc-1';
    const block1 = 'block-101';
    const block2 = 'block-102';
    const clientA = 'client-A';
    const clientB = 'client-B';

    const resA = lockManager.acquireBlockLock(docId, block1, clientA, 5000);
    expect(resA.success).toBe(true);

    const resB = lockManager.acquireBlockLock(docId, block2, clientB, 5000);
    expect(resB.success).toBe(true);
    expect(resB.lock.clientId).toBe(clientB);

    expect(lockManager.getBlockLock(docId, block1).clientId).toBe(clientA);
    expect(lockManager.getBlockLock(docId, block2).clientId).toBe(clientB);
  });

  // Rule 4: Disconnect Releases Locks Automatically
  it('4. disconnect cleanup: client disconnect automatically releases all locks owned by that client', () => {
    const docId = 'doc-1';
    const block1 = 'block-101';
    const block2 = 'block-102';
    const clientA = 'client-A';

    lockManager.acquireBlockLock(docId, block1, clientA, 5000);
    lockManager.acquireBlockLock(docId, block2, clientA, 5000);

    expect(lockManager.getBlockLock(docId, block1)).not.toBeNull();
    expect(lockManager.getBlockLock(docId, block2)).not.toBeNull();

    // Simulate client disconnect cleanup
    const releasedMap = lockManager.releaseAllLocksForClient(clientA);
    expect(releasedMap.get(docId)).toContain(block1);
    expect(releasedMap.get(docId)).toContain(block2);

    expect(lockManager.getBlockLock(docId, block1)).toBeNull();
    expect(lockManager.getBlockLock(docId, block2)).toBeNull();
  });

  // Rule 5: TTL Expiration Allows Re-acquisition
  it('5. TTL expiry: lock expires after TTL allowing another client to re-acquire the block', async () => {
    const customManager = new BlockLockManager(50); // 50ms short TTL for testing
    const docId = 'doc-1';
    const blockId = 'block-ttl';
    const clientA = 'client-A';
    const clientB = 'client-B';

    const resA = customManager.acquireBlockLock(docId, blockId, clientA, 50);
    expect(resA.success).toBe(true);

    // Immediate acquire by client B fails
    expect(customManager.acquireBlockLock(docId, blockId, clientB, 50).success).toBe(false);

    // Wait for TTL to expire (> 50ms)
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Lock is now expired, getBlockLock returns null
    expect(customManager.getBlockLock(docId, blockId)).toBeNull();

    // Client B can now acquire the expired lock
    const resB = customManager.acquireBlockLock(docId, blockId, clientB, 500);
    expect(resB.success).toBe(true);
    expect(resB.lock.clientId).toBe(clientB);
  });

  // Rule 6: Client B Cannot Release Client A's Lock
  it("6. unauthorized release: Client B cannot release Client A's lock", () => {
    const docId = 'doc-1';
    const blockId = 'block-protected';
    const clientA = 'client-A';
    const clientB = 'client-B';

    lockManager.acquireBlockLock(docId, blockId, clientA, 5000);

    // Client B attempts to release Client A's lock
    const releaseRes = lockManager.releaseBlockLock(docId, blockId, clientB);
    expect(releaseRes.success).toBe(false);
    expect(releaseRes.reason).toBe('UNAUTHORIZED_RELEASE');

    // Lock must remain active for Client A
    const activeLock = lockManager.getBlockLock(docId, blockId);
    expect(activeLock).not.toBeNull();
    expect(activeLock.clientId).toBe(clientA);

    // Client A can release its own lock
    const ownReleaseRes = lockManager.releaseBlockLock(docId, blockId, clientA);
    expect(ownReleaseRes.success).toBe(true);
    expect(lockManager.getBlockLock(docId, blockId)).toBeNull();
  });

  // Additional Rule: Invalid document/block IDs are rejected
  it('7. invalid IDs: invalid document or block IDs are rejected, not silently ignored', () => {
    expect(() => lockManager.acquireBlockLock('', 'block-1', 'client-A')).toThrow();
    expect(() => lockManager.acquireBlockLock('doc-1', '', 'client-A')).toThrow();
    expect(() => lockManager.acquireBlockLock('__proto__', 'block-1', 'client-A')).toThrow();
    expect(() => lockManager.getBlockLock('doc-1', 'constructor')).toThrow();
    expect(() => lockManager.releaseBlockLock(null, 'block-1', 'client-A')).toThrow();
  });
});
