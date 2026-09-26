import React, { useState } from 'react';
import { DocumentBlock as DocumentBlockType, BlockType, BlockStateInfo } from '../../types/block';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { ListBlock } from './blocks/ListBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
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

  // Visual State styles mapping
  const getStateBorderStyles = () => {
    if (blockStateInfo?.state === 'conflict_detected') {
      return 'border-amber-500/80 bg-amber-950/20 shadow-amber-500/10 shadow-lg';
    }
    if (blockStateInfo?.state === 'editing_remote' && blockStateInfo.editingUser) {
      return 'border-emerald-500/80 bg-emerald-950/20 shadow-emerald-500/10 shadow-lg';
    }
    if (isFocused) {
      return 'border-brand-500/70 bg-brand-500/5 shadow-brand-500/10 shadow-md';
    }
    return 'border-transparent hover:border-slate-800 hover:bg-slate-900/40';
  };

  const handleResolveConflict = (choice: ConflictResolutionChoice, mergedText?: string) => {
    if (choice === 'keep_mine') {
      // Keep local content
    } else if (choice === 'keep_remote' && blockStateInfo?.conflictData) {
      onChangeContent(blockStateInfo.conflictData.remoteContent);
    } else if (choice === 'merged' && mergedText) {
      onChangeContent(mergedText);
    }
  };

  const renderSpecificBlock = () => {
    switch (block.type) {
      case 'heading':
        return (
          <HeadingBlock
            block={block}
            isFocused={isFocused}
            onFocus={onFocus}
            onChangeContent={onChangeContent}
            onEnter={onEnter}
            onBackspaceOnEmpty={onBackspaceOnEmpty}
            onOpenSlashMenu={() => setIsSlashMenuOpen(true)}
          />
        );
      case 'code':
        return (
          <CodeBlock
            block={block}
            isFocused={isFocused}
            onFocus={onFocus}
            onChangeContent={onChangeContent}
            onChangeLanguage={(lang) => onChangeMetadata({ language: lang })}
            onBackspaceOnEmpty={onBackspaceOnEmpty}
          />
        );
      case 'list':
        return (
          <ListBlock
            block={block}
            isFocused={isFocused}
            onFocus={onFocus}
            onChangeContent={onChangeContent}
            onEnter={onEnter}
            onBackspaceOnEmpty={onBackspaceOnEmpty}
            onOpenSlashMenu={() => setIsSlashMenuOpen(true)}
          />
        );
      case 'quote':
        return (
          <QuoteBlock
            block={block}
            isFocused={isFocused}
            onFocus={onFocus}
            onChangeContent={onChangeContent}
            onEnter={onEnter}
            onBackspaceOnEmpty={onBackspaceOnEmpty}
            onOpenSlashMenu={() => setIsSlashMenuOpen(true)}
          />
        );
      case 'paragraph':
      default:
        return (
          <ParagraphBlock
            block={block}
            isFocused={isFocused}
            onFocus={onFocus}
            onChangeContent={onChangeContent}
            onEnter={onEnter}
            onBackspaceOnEmpty={onBackspaceOnEmpty}
            onOpenSlashMenu={() => setIsSlashMenuOpen(true)}
          />
        );
    }
  };

  return (
    <div className="relative group/block my-1.5 transition-all duration-150">
      {/* Remote User Editing Badge Indicator */}
      {blockStateInfo?.state === 'editing_remote' && blockStateInfo.editingUser && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-t-lg w-fit ml-2 animate-in fade-in duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>🟢 {blockStateInfo.editingUser.name} is editing this block</span>
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
        {/* Floating Block Toolbar when focused or hovered */}
        <div className="absolute -top-4 right-4 opacity-0 group-hover/block:opacity-100 focus-within:opacity-100 transition-opacity z-20">
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

        {renderSpecificBlock()}

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
