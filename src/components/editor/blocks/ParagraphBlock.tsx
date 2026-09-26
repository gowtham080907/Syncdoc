import React, { useRef, useEffect, useCallback } from 'react';
import { DocumentBlock } from '../../../types/block';
import { getCaretCharacterOffsetWithin, setCaretPosition } from '../../../utils/editorUtils';

export interface ParagraphBlockProps {
  block: DocumentBlock;
  isFocused: boolean;
  onFocus: () => void;
  onChangeContent: (newContent: string) => void;
  onEnter: (contentBefore: string, contentAfter: string) => void;
  onBackspaceOnEmpty: () => void;
  onOpenSlashMenu: () => void;
}

export const ParagraphBlock: React.FC<ParagraphBlockProps> = React.memo(({
  block,
  isFocused,
  onFocus,
  onChangeContent,
  onEnter,
  onBackspaceOnEmpty,
  onOpenSlashMenu,
}) => {
  const contentRef = useRef<HTMLParagraphElement>(null);
  const isComposingRef = useRef(false);

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
    if (!contentRef.current || isComposingRef.current) return;
    const text = contentRef.current.innerText;
    onChangeContent(text);

    if (text === '/') {
      onOpenSlashMenu();
    }
  }, [onChangeContent, onOpenSlashMenu]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLParagraphElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!contentRef.current) return;
      const text = contentRef.current.innerText;
      const caret = getCaretCharacterOffsetWithin(contentRef.current);
      const before = text.slice(0, caret);
      const after = text.slice(caret);
      onEnter(before, after);
    } else if (e.key === 'Backspace') {
      if (!contentRef.current) return;
      const text = contentRef.current.innerText;
      if (text.trim() === '') {
        e.preventDefault();
        onBackspaceOnEmpty();
      }
    }
  };

  return (
    <p
      id={`block-content-${block.id}`}
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={onFocus}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => { isComposingRef.current = true; }}
      onCompositionEnd={() => { isComposingRef.current = false; handleInput(); }}
      className="outline-none text-slate-900 text-base leading-relaxed font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none py-1 px-1 transition-colors rounded"
      data-placeholder="Type '/' for commands or start typing..."
    />
  );
});

ParagraphBlock.displayName = 'ParagraphBlock';
