import React, { useRef, useEffect, useCallback } from 'react';
import { DocumentBlock } from '../../../types/block';
import { getCaretCharacterOffsetWithin, setCaretPosition } from '../../../utils/editorUtils';

export interface ListBlockProps {
  block: DocumentBlock;
  isFocused: boolean;
  onFocus: () => void;
  onChangeContent: (newContent: string) => void;
  onEnter: (contentBefore: string, contentAfter: string) => void;
  onBackspaceOnEmpty: () => void;
  onOpenSlashMenu: () => void;
}

export const ListBlock: React.FC<ListBlockProps> = React.memo(({
  block,
  isFocused,
  onFocus,
  onChangeContent,
  onEnter,
  onBackspaceOnEmpty,
  onOpenSlashMenu,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const listType = block.type === 'numbered-list' || block.metadata?.listType === 'number' ? 'number' : 'bullet';

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
    <div className="flex items-start gap-3 py-1 px-1">
      <div className="mt-1.5 shrink-0 text-blue-600 select-none font-semibold">
        {listType === 'number' ? (
          <span className="font-mono text-xs font-bold text-slate-600">
            {(block.order % 9) + 1}.
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
        )}
      </div>

      <div
        id={`block-content-${block.id}`}
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={onFocus}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="flex-1 outline-none text-slate-900 text-base leading-relaxed font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none rounded"
        data-placeholder="List item..."
      />
    </div>
  );
});

ListBlock.displayName = 'ListBlock';
