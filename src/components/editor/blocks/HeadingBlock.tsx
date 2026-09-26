import React, { useRef, useEffect, useCallback } from 'react';
import { DocumentBlock, HeadingLevel } from '../../../types/block';
import { getCaretCharacterOffsetWithin, setCaretPosition } from '../../../utils/editorUtils';

export interface HeadingBlockProps {
  block: DocumentBlock;
  isFocused: boolean;
  onFocus: () => void;
  onChangeContent: (newContent: string) => void;
  onEnter: (contentBefore: string, contentAfter: string) => void;
  onBackspaceOnEmpty: () => void;
  onOpenSlashMenu: () => void;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = React.memo(({
  block,
  isFocused,
  onFocus,
  onChangeContent,
  onEnter,
  onBackspaceOnEmpty,
  onOpenSlashMenu,
}) => {
  const contentRef = useRef<HTMLHeadingElement>(null);
  const headingLevel: HeadingLevel = block.metadata?.headingLevel || 1;

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== block.content) {
      const caretOffset = document.activeElement === contentRef.current
        ? getCaretCharacterOffsetWithin(contentRef.current)
        : null;

      contentRef.current.innerText = block.content;

      if (caretOffset !== null && contentRef.current) {
        setCaretPosition(contentRef.current, caretOffset);
      }
    }
  }, [block.content]);

  useEffect(() => {
    if (isFocused && contentRef.current && document.activeElement !== contentRef.current) {
      contentRef.current.focus();
    }
  }, [isFocused]);

  const handleInput = useCallback(() => {
    if (!contentRef.current) return;
    const text = contentRef.current.innerText;
    onChangeContent(text);

    if (text === '/') {
      onOpenSlashMenu();
    }
  }, [onChangeContent, onOpenSlashMenu]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!contentRef.current) return;
      const text = contentRef.current.innerText;
      const caret = getCaretCharacterOffsetWithin(contentRef.current);
      onEnter(text.slice(0, caret), text.slice(caret));
    } else if (e.key === 'Backspace') {
      if (!contentRef.current) return;
      if (contentRef.current.innerText.trim() === '') {
        e.preventDefault();
        onBackspaceOnEmpty();
      }
    }
  };

  const getHeadingStyles = () => {
    switch (headingLevel) {
      case 1:
        return 'text-2xl md:text-3xl font-extrabold text-white tracking-tight py-2';
      case 2:
        return 'text-xl md:text-2xl font-bold text-slate-100 tracking-tight py-1.5';
      case 3:
        return 'text-lg font-semibold text-brand-300 py-1';
    }
  };

  const Component = headingLevel === 1 ? 'h1' : headingLevel === 2 ? 'h2' : 'h3';

  return (
    <Component
      id={`block-content-${block.id}`}
      ref={contentRef as any}
      contentEditable
      suppressContentEditableWarning
      onFocus={onFocus}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={`outline-none font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600 empty:before:pointer-events-none px-1 rounded ${getHeadingStyles()}`}
      data-placeholder={`Heading ${headingLevel}...`}
    />
  );
});

HeadingBlock.displayName = 'HeadingBlock';
