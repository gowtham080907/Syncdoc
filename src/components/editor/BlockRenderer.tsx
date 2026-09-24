import React from 'react';
import { DocumentBlock as DocumentBlockType, BlockType, BlockStateInfo } from '../../types/block';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { BulletListBlock } from './blocks/BulletListBlock';
import { NumberedListBlock } from './blocks/NumberedListBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { ListBlock } from './blocks/ListBlock';

export interface BlockRendererProps {
  block: DocumentBlockType;
  isFocused: boolean;
  onFocus: () => void;
  onChangeContent: (newContent: string) => void;
  onChangeType: (newType: BlockType) => void;
  onChangeMetadata: (metadata: Record<string, unknown>) => void;
  onEnter: (contentBefore: string, contentAfter: string) => void;
  onBackspaceOnEmpty: () => void;
  onOpenSlashMenu: () => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = React.memo(({
  block,
  isFocused,
  onFocus,
  onChangeContent,
  onChangeType,
  onChangeMetadata,
  onEnter,
  onBackspaceOnEmpty,
  onOpenSlashMenu,
}) => {
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
          onOpenSlashMenu={onOpenSlashMenu}
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

    case 'bullet-list':
      return (
        <BulletListBlock
          block={block}
          isFocused={isFocused}
          onFocus={onFocus}
          onChangeContent={onChangeContent}
          onEnter={onEnter}
          onBackspaceOnEmpty={onBackspaceOnEmpty}
          onOpenSlashMenu={onOpenSlashMenu}
        />
      );

    case 'numbered-list':
      return (
        <NumberedListBlock
          block={block}
          isFocused={isFocused}
          onFocus={onFocus}
          onChangeContent={onChangeContent}
          onEnter={onEnter}
          onBackspaceOnEmpty={onBackspaceOnEmpty}
          onOpenSlashMenu={onOpenSlashMenu}
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
          onOpenSlashMenu={onOpenSlashMenu}
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
          onOpenSlashMenu={onOpenSlashMenu}
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
          onOpenSlashMenu={onOpenSlashMenu}
        />
      );
  }
});

BlockRenderer.displayName = 'BlockRenderer';
