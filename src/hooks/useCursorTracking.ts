import { useState, useCallback, useEffect } from 'react';
import { RemoteCursorState } from '../types/collaboration';
import { getCaretCharacterOffsetWithin } from '../utils/editorUtils';

export const useCursorTracking = (
  activeBlockId: string | null,
  onCursorMove?: (blockId: string, offset: number) => void
) => {
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursorState[]>([]);

  const handleSelectionChange = useCallback(() => {
    if (!activeBlockId) return;
    const blockEl = document.getElementById(`block-content-${activeBlockId}`);
    if (blockEl) {
      const offset = getCaretCharacterOffsetWithin(blockEl);
      if (onCursorMove) {
        onCursorMove(activeBlockId, offset);
      }
    }
  }, [activeBlockId, onCursorMove]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return {
    remoteCursors,
    setRemoteCursors,
  };
};
