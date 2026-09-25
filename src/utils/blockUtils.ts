import { DocumentBlock, BlockType } from '../types/block';

export const createDefaultBlock = (
  type: BlockType = 'paragraph',
  content: string = '',
  order: number = 0
): DocumentBlock => {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    content,
    order,
    metadata: {
      headingLevel: type === 'heading' ? 1 : undefined,
      language: type === 'code' ? 'typescript' : undefined,
      listType: type === 'list' ? 'bullet' : undefined,
    },
  };
};

export const getInitialDocumentBlocks = (): DocumentBlock[] => [
  {
    id: 'block-intro-heading',
    type: 'heading',
    content: 'SyncDoc Architecture Specification',
    order: 0,
    metadata: { headingLevel: 1 },
  },
  {
    id: 'block-intro-para',
    type: 'paragraph',
    content: 'SyncDoc is a real-time collaborative document engine using Yjs CRDTs and AST node structures to eliminate destructive concurrent overwrites.',
    order: 1,
  },
  {
    id: 'block-code-example',
    type: 'code',
    content: 'const syncDoc = new Y.Doc();\nconst blocksMap = syncDoc.getMap("blocks");\nconsole.log("CRDT doc initialized", syncDoc.guid);',
    order: 2,
    metadata: { language: 'typescript' },
  },
  {
    id: 'block-quote-sec',
    type: 'quote',
    content: 'Fine-grained block tracking ensures isolated keystrokes and seamless multi-user collaboration.',
    order: 3,
  },
  {
    id: 'block-list-features',
    type: 'list',
    content: 'Real-time Yjs CRDT state sync',
    order: 4,
    metadata: { listType: 'bullet' },
  },
  {
    id: 'block-list-features-2',
    type: 'list',
    content: 'Block-level isolated re-renders (No cursor jumps)',
    order: 5,
    metadata: { listType: 'bullet' },
  },
  {
    id: 'block-list-features-3',
    type: 'list',
    content: 'AST node rendering & conflict resolution UI',
    order: 6,
    metadata: { listType: 'bullet' },
  },
];

export const reorderBlocks = (
  blocks: DocumentBlock[],
  startIndex: number,
  endIndex: number
): DocumentBlock[] => {
  const result = Array.from(blocks);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((block, idx) => ({ ...block, order: idx }));
};
