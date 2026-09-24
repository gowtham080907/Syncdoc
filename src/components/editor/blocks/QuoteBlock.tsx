import React, { useRef, useEffect, useCallback } from 'react';
import { DocumentBlock } from '../../../types/block';
import { getCaretCharacterOffsetWithin, setCaretPosition } from '../../../utils/editorUtils';
import { Quote } from 'lucide-react';

export interface QuoteBlockProps {
  block: DocumentBlock;
  isFocused: boolean;
  onFocus: () => void;
  onChangeContent: (newContent: string) => void;
  onEnter: (contentBefore: string, contentAfter: string) => void;
  onBackspaceOnEmpty: () => void;
  onOpenSlashMenu: () => void;
}

export const QuoteBlock: React.FC<QuoteBlockProps> = React.memo(({
  block,
  isFocused,
  onFocus,
  onChangeContent,
  onEnter,
  onBackspaceOnEmpty,
  onOpenSlashMenu,
}) => {
  const contentRef = useRef<HTMLQuoteElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLQuoteElement>) => {
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

  return (
    <div className="flex gap-3 my-2 pl-4 py-2 border-l-4 border-blue-600 bg-blue-50/50 rounded-r-xl">
      <Quote className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      <blockquote
        id={`block-content-${block.id}`}
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={onFocus}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="flex-1 outline-none text-slate-800 italic text-base leading-relaxed font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
        data-placeholder="Quote or highlight note..."
      />
    </div>
  );
});

QuoteBlock.displayName = 'QuoteBlock';
