import React, { useState, useCallback } from 'react';
import { DocumentBlock as DocumentBlockType, BlockType, BlockStateInfo } from '../../types/block';
import { DocumentBlock } from './DocumentBlock';
import { useDocumentBlocks } from '../../hooks/useDocumentBlocks';
import { PresenceUser } from '../../types/collaboration';
import { Plus } from 'lucide-react';
import { Button } from '../common/Button';

export interface BlockEditorProps {
  blocks: DocumentBlockType[];
  addBlock: (type?: BlockType, content?: string, afterId?: string) => DocumentBlockType;
  updateBlockContent: (id: string, content: string) => void;
  updateBlockMetadata: (id: string, metadata: Record<string, unknown>) => void;
  changeBlockType: (id: string, newType: BlockType) => void;
  deleteBlock: (id: string) => void;
  reorderBlocks: (sourceIndex: number, destIndex: number) => void;
  getUserEditingBlock?: (blockId: string) => PresenceUser | undefined;
  activeConflictBlockId?: string | null;
  conflictData?: {
    remoteContent: string;
    remoteAuthor: string;
    timestamp: string;
  };
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  addBlock,
  updateBlockContent,
  updateBlockMetadata,
  changeBlockType,
  deleteBlock,
  reorderBlocks,
  getUserEditingBlock,
  activeConflictBlockId,
  conflictData,
}) => {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(
    blocks.length > 0 ? blocks[0].id : null
  );

  const { handleEnterKey, handleBackspaceOnEmpty } = useDocumentBlocks(
    blocks,
    addBlock,
    updateBlockContent,
    changeBlockType,
    deleteBlock
  );

  const handleEnter = useCallback(
    (currentBlockId: string, before: string, after: string) => {
      const nextId = handleEnterKey(currentBlockId, before, after);
      setFocusedBlockId(nextId);
    },
    [handleEnterKey]
  );

  const handleBackspace = useCallback(
    (currentBlockId: string, index: number) => {
      const prevId = handleBackspaceOnEmpty(currentBlockId, index);
      if (prevId) {
        setFocusedBlockId(prevId);
      }
    },
    [handleBackspaceOnEmpty]
  );

  const handleDuplicate = useCallback(
    (block: DocumentBlockType) => {
      addBlock(block.type, block.content, block.id);
    },
    [addBlock]
  );

  return (
    <div className="max-w-4xl mx-auto w-full space-y-2 py-4 font-sans">
      {blocks.map((block, index) => {
        const isFocused = focusedBlockId === block.id;
        const editingUser = getUserEditingBlock ? getUserEditingBlock(block.id) : undefined;

        let blockStateInfo: BlockStateInfo | undefined;

        if (activeConflictBlockId === block.id && conflictData) {
          blockStateInfo = {
            state: 'conflict_detected',
            conflictData: {
              localContent: block.content,
              remoteContent: conflictData.remoteContent,
              remoteAuthor: conflictData.remoteAuthor,
              timestamp: conflictData.timestamp,
            },
          };
        } else if (editingUser) {
          blockStateInfo = {
            state: 'editing_remote',
            editingUser: {
              id: editingUser.id,
              name: editingUser.name,
              color: editingUser.color,
              avatar: editingUser.avatar,
            },
          };
        } else if (isFocused) {
          blockStateInfo = { state: 'editing_me' };
        }

        return (
          <DocumentBlock
            key={block.id}
            block={block}
            isFocused={isFocused}
            onFocus={() => setFocusedBlockId(block.id)}
            onChangeContent={(content) => updateBlockContent(block.id, content)}
            onChangeType={(newType) => changeBlockType(block.id, newType)}
            onChangeMetadata={(meta) => updateBlockMetadata(block.id, meta)}
            onEnter={(before, after) => handleEnter(block.id, before, after)}
            onBackspaceOnEmpty={() => handleBackspace(block.id, index)}
            onAddBelow={() => {
              const newB = addBlock('paragraph', '', block.id);
              setFocusedBlockId(newB.id);
            }}
            onDelete={() => deleteBlock(block.id)}
            onMoveUp={() => reorderBlocks(index, Math.max(0, index - 1))}
            onMoveDown={() => reorderBlocks(index, Math.min(blocks.length - 1, index + 1))}
            onDuplicate={() => handleDuplicate(block)}
            blockStateInfo={blockStateInfo}
          />
        );
      })}

      <div className="pt-6 pb-12 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newB = addBlock('paragraph', '');
            setFocusedBlockId(newB.id);
          }}
          icon={<Plus className="w-4 h-4 text-blue-600" />}
          className="text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 font-semibold shadow-xs"
        >
          Add Block Below
        </Button>
      </div>
    </div>
  );
};
