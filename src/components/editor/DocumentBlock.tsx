import React, { useState } from 'react';
import { DocumentBlock as DocumentBlockType, BlockType, BlockStateInfo } from '../../types/block';
import { BlockRenderer } from './BlockRenderer';
import { BlockToolbar } from './BlockToolbar';
import { SlashMenu } from './SlashMenu';
import { ConflictIndicator } from './ConflictIndicator';
import { ConflictPanel } from './ConflictPanel';
import { ConflictResolutionChoice } from '../../types/ast';

export interface DocumentBlockProps {
  block: DocumentBlockType;
  isFocused: boolean;
  onFocus: () => void;
  onChangeContent: (newContent: string) => void;
  onChangeType: (newType: BlockType) => void;
  onChangeMetadata: (metadata: Record<string, unknown>) => void;
  onEnter: (contentBefore: string, contentAfter: string) => void;
  onBackspaceOnEmpty: () => void;
  onAddBelow: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  blockStateInfo?: BlockStateInfo;
}

export const DocumentBlock: React.FC<DocumentBlockProps> = React.memo(({
  block,
  isFocused,
  onFocus,
  onChangeContent,
  onChangeType,
  onChangeMetadata,
  onEnter,
  onBackspaceOnEmpty,
  onAddBelow,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  blockStateInfo,
}) => {
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [isConflictPanelOpen, setIsConflictPanelOpen] = useState(false);

  // Visual State styles mapping for light-first design
  const getStateBorderStyles = () => {
    if (blockStateInfo?.state === 'conflict_detected') {
      return 'border-amber-400 bg-amber-50/50 shadow-sm';
    }
    if (blockStateInfo?.state === 'editing_remote' && blockStateInfo.editingUser) {
      return 'border-emerald-400 bg-emerald-50/40 shadow-sm';
    }
    if (isFocused) {
      return 'border-blue-400 bg-blue-50/30 shadow-sm ring-1 ring-blue-200';
    }
    return 'border-transparent hover:border-slate-200 hover:bg-slate-50/50';
  };

  const handleResolveConflict = (choice: ConflictResolutionChoice, mergedText?: string) => {
    if (choice === 'keep_mine') {
      // Keep local content
    } else if (choice === 'keep_remote' && blockStateInfo?.conflictData) {
      onChangeContent(blockStateInfo.conflictData.remoteContent);
    } else if (choice === 'merged' && mergedText) {
      onChangeContent(mergedText);
    }
    setIsConflictPanelOpen(false);
  };

  return (
    <div className="relative group/block my-1.5 transition-all duration-150 font-sans">
      {/* Remote User Editing Badge Indicator */}
      {blockStateInfo?.state === 'editing_remote' && blockStateInfo.editingUser && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-t-lg w-fit ml-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>🟢 {blockStateInfo.editingUser.name} is editing block #{block.id.slice(0, 8)}</span>
        </div>
      )}

      {/* Conflict Indicator Badge */}
      {blockStateInfo?.state === 'conflict_detected' && blockStateInfo.conflictData && (
        <ConflictIndicator
          remoteAuthor={blockStateInfo.conflictData.remoteAuthor}
          onOpenPanel={() => setIsConflictPanelOpen(true)}
        />
      )}

      {/* Main Block Container */}
      <div className={`relative p-2.5 rounded-xl border transition-all ${getStateBorderStyles()}`}>
        {/* Contextual Block Toolbar when focused or hovered */}
        <div className="absolute -top-3.5 right-4 opacity-0 group-hover/block:opacity-100 focus-within:opacity-100 transition-opacity z-20">
          <BlockToolbar
            currentType={block.type}
            onChangeType={onChangeType}
            onAddBelow={onAddBelow}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDuplicate={onDuplicate}
          />
        </div>

        <BlockRenderer
          block={block}
          isFocused={isFocused}
          onFocus={onFocus}
          onChangeContent={onChangeContent}
          onChangeType={onChangeType}
          onChangeMetadata={onChangeMetadata}
          onEnter={onEnter}
          onBackspaceOnEmpty={onBackspaceOnEmpty}
          onOpenSlashMenu={() => setIsSlashMenuOpen(true)}
        />

        {/* Slash Command Menu Popover */}
        {isSlashMenuOpen && (
          <SlashMenu
            onSelect={(type) => {
              onChangeType(type);
              setIsSlashMenuOpen(false);
            }}
            onClose={() => setIsSlashMenuOpen(false)}
          />
        )}
      </div>

      {/* AST Conflict Resolution Panel */}
      {blockStateInfo?.conflictData && (
        <ConflictPanel
          isOpen={isConflictPanelOpen}
          onClose={() => setIsConflictPanelOpen(false)}
          localContent={block.content}
          remoteContent={blockStateInfo.conflictData.remoteContent}
          remoteAuthor={blockStateInfo.conflictData.remoteAuthor}
          onResolve={handleResolveConflict}
        />
      )}
    </div>
  );
});

DocumentBlock.displayName = 'DocumentBlock';
