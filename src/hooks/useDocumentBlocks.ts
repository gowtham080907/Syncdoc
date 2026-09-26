import { useCallback } from 'react';
import { DocumentBlock, BlockType } from '../types/block';

export const useDocumentBlocks = (
  blocks: DocumentBlock[],
  addBlock: (type?: BlockType, content?: string, afterId?: string) => DocumentBlock,
  updateBlockContent: (id: string, content: string) => void,
  changeBlockType: (id: string, newType: BlockType) => void,
  deleteBlock: (id: string) => void
) => {
  const handleEnterKey = useCallback(
    (currentBlockId: string, contentBeforeCaret: string, contentAfterCaret: string) => {
      // Update current block content to text before caret
      updateBlockContent(currentBlockId, contentBeforeCaret);
      // Create new paragraph block with text after caret right after current block
      const newBlock = addBlock('paragraph', contentAfterCaret, currentBlockId);
      return newBlock.id;
    },
    [addBlock, updateBlockContent]
  );

  const handleBackspaceOnEmpty = useCallback(
    (currentBlockId: string, index: number) => {
      if (blocks.length <= 1) return null;
      const prevBlock = blocks[index - 1];
      deleteBlock(currentBlockId);
      return prevBlock ? prevBlock.id : null;
    },
    [blocks, deleteBlock]
  );

  return {
    handleEnterKey,
    handleBackspaceOnEmpty,
  };
};
