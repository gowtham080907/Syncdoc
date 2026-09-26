import { useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { DocumentBlock, BlockType } from '../types/block';
import { ConnectionStatus } from '../types/collaboration';
import { createYjsSession } from '../services/websocket';
import { getInitialDocumentBlocks, createDefaultBlock } from '../utils/blockUtils';

export interface UseYjsDocumentReturn {
  blocks: DocumentBlock[];
  connectionStatus: ConnectionStatus;
  updateBlockContent: (id: string, content: string) => void;
  updateBlockMetadata: (id: string, metadata: Record<string, unknown>) => void;
  changeBlockType: (id: string, newType: BlockType) => void;
  addBlock: (type?: BlockType, content?: string, afterId?: string) => DocumentBlock;
  deleteBlock: (id: string) => void;
  reorderBlocks: (sourceIndex: number, destIndex: number) => void;
  setAllBlocks: (newBlocks: DocumentBlock[]) => void;
  yDoc: Y.Doc | null;
}

export const useYjsDocument = (documentId: string): UseYjsDocumentReturn => {
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const sessionRef = useRef<ReturnType<typeof createYjsSession> | null>(null);
  const blocksMapRef = useRef<Y.Map<any> | null>(null);
  const blockOrderRef = useRef<Y.Array<string> | null>(null);

  // Helper to serialize Yjs structures into DocumentBlock array
  const syncBlocksFromYjs = useCallback(() => {
    if (!blocksMapRef.current || !blockOrderRef.current) return;

    const orderArray = blockOrderRef.current.toArray();
    const map = blocksMapRef.current;

    const newBlocks: DocumentBlock[] = orderArray
      .map((id, index) => {
        const blockMap = map.get(id);
        if (!blockMap) return null;

        const yText = blockMap.get('content') as Y.Text | undefined;
        const type = blockMap.get('type') as BlockType || 'paragraph';
        const metadata = blockMap.get('metadata') || {};

        return {
          id,
          type,
          content: yText ? yText.toString() : (blockMap.get('rawContent') || ''),
          order: index,
          metadata,
        } as DocumentBlock;
      })
      .filter((b): b is DocumentBlock => b !== null);

    setBlocks(newBlocks);
  }, []);

  useEffect(() => {
    if (!documentId) return;

    const session = createYjsSession(`syncdoc-room-${documentId}`, (status) => {
      setConnectionStatus(status);
    });
    sessionRef.current = session;

    const doc = session.doc;
    const blocksMap = doc.getMap('blocks');
    const blockOrder = doc.getArray<string>('blockOrder');
    blocksMapRef.current = blocksMap;
    blockOrderRef.current = blockOrder;

    // Initialize document with default blocks if empty
    doc.transact(() => {
      if (blockOrder.length === 0) {
        const initialBlocks = getInitialDocumentBlocks();
        initialBlocks.forEach((b, idx) => {
          const bMap = new Y.Map();
          const yText = new Y.Text();
          yText.insert(0, b.content);

          bMap.set('content', yText);
          bMap.set('type', b.type);
          bMap.set('metadata', b.metadata || {});

          blocksMap.set(b.id, bMap);
          blockOrder.push([b.id]);
        });
      }
    });

    syncBlocksFromYjs();

    // Observe changes to Y.Map and Y.Array for delta updates
    const handleMapObserver = () => {
      syncBlocksFromYjs();
    };

    const handleOrderObserver = () => {
      syncBlocksFromYjs();
    };

    blocksMap.observeDeep(handleMapObserver);
    blockOrder.observe(handleOrderObserver);

    return () => {
      blocksMap.unobserveDeep(handleMapObserver);
      blockOrder.unobserve(handleOrderObserver);
      session.destroy();
    };
  }, [documentId, syncBlocksFromYjs]);

  const updateBlockContent = useCallback((id: string, content: string) => {
    const map = blocksMapRef.current;
    if (!map) return;
    const bMap = map.get(id);
    if (!bMap) return;

    const doc = sessionRef.current?.doc;
    if (!doc) return;

    doc.transact(() => {
      const yText = bMap.get('content') as Y.Text | undefined;
      if (yText) {
        const currentStr = yText.toString();
        if (currentStr !== content) {
          yText.delete(0, currentStr.length);
          yText.insert(0, content);
        }
      } else {
        bMap.set('rawContent', content);
      }
    });
  }, []);

  const updateBlockMetadata = useCallback((id: string, metadata: Record<string, unknown>) => {
    const map = blocksMapRef.current;
    if (!map) return;
    const bMap = map.get(id);
    if (!bMap) return;

    const doc = sessionRef.current?.doc;
    if (!doc) return;

    doc.transact(() => {
      const existing = bMap.get('metadata') || {};
      bMap.set('metadata', { ...existing, ...metadata });
    });
  }, []);

  const changeBlockType = useCallback((id: string, newType: BlockType) => {
    const map = blocksMapRef.current;
    if (!map) return;
    const bMap = map.get(id);
    if (!bMap) return;

    const doc = sessionRef.current?.doc;
    if (!doc) return;

    doc.transact(() => {
      bMap.set('type', newType);
      const meta = bMap.get('metadata') || {};
      if (newType === 'heading' && !meta.headingLevel) {
        bMap.set('metadata', { ...meta, headingLevel: 1 });
      } else if (newType === 'code' && !meta.language) {
        bMap.set('metadata', { ...meta, language: 'typescript' });
      } else if (newType === 'list' && !meta.listType) {
        bMap.set('metadata', { ...meta, listType: 'bullet' });
      }
    });
  }, []);

  const addBlock = useCallback(
    (type: BlockType = 'paragraph', content: string = '', afterId?: string): DocumentBlock => {
      const doc = sessionRef.current?.doc;
      const map = blocksMapRef.current;
      const order = blockOrderRef.current;

      const newBlock = createDefaultBlock(type, content);

      if (doc && map && order) {
        doc.transact(() => {
          const bMap = new Y.Map();
          const yText = new Y.Text();
          yText.insert(0, content);

          bMap.set('content', yText);
          bMap.set('type', newBlock.type);
          bMap.set('metadata', newBlock.metadata || {});

          map.set(newBlock.id, bMap);

          if (afterId) {
            const index = order.toArray().indexOf(afterId);
            if (index !== -1) {
              order.insert(index + 1, [newBlock.id]);
            } else {
              order.push([newBlock.id]);
            }
          } else {
            order.push([newBlock.id]);
          }
        });
      }

      return newBlock;
    },
    []
  );

  const deleteBlock = useCallback((id: string) => {
    const doc = sessionRef.current?.doc;
    const map = blocksMapRef.current;
    const order = blockOrderRef.current;

    if (doc && map && order) {
      doc.transact(() => {
        const orderArr = order.toArray();
        const index = orderArr.indexOf(id);
        if (index !== -1 && orderArr.length > 1) {
          order.delete(index, 1);
          map.delete(id);
        }
      });
    }
  }, []);

  const reorderBlocks = useCallback((sourceIndex: number, destIndex: number) => {
    const doc = sessionRef.current?.doc;
    const order = blockOrderRef.current;

    if (doc && order) {
      doc.transact(() => {
        const arr = order.toArray();
        if (sourceIndex >= 0 && sourceIndex < arr.length && destIndex >= 0 && destIndex < arr.length) {
          const [movedId] = arr.splice(sourceIndex, 1);
          arr.splice(destIndex, 0, movedId);

          order.delete(0, order.length);
          order.push(arr);
        }
      });
    }
  }, []);

  const setAllBlocks = useCallback((newBlocks: DocumentBlock[]) => {
    const doc = sessionRef.current?.doc;
    const map = blocksMapRef.current;
    const order = blockOrderRef.current;

    if (doc && map && order) {
      doc.transact(() => {
        map.clear();
        order.delete(0, order.length);

        const newIds: string[] = [];
        newBlocks.forEach((b) => {
          const bMap = new Y.Map();
          const yText = new Y.Text();
          yText.insert(0, b.content);

          bMap.set('content', yText);
          bMap.set('type', b.type);
          bMap.set('metadata', b.metadata || {});

          map.set(b.id, bMap);
          newIds.push(b.id);
        });

        order.push(newIds);
      });
    }
  }, []);

  return {
    blocks,
    connectionStatus,
    updateBlockContent,
    updateBlockMetadata,
    changeBlockType,
    addBlock,
    deleteBlock,
    reorderBlocks,
    setAllBlocks,
    yDoc: sessionRef.current?.doc || null,
  };
};
