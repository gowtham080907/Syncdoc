import React from 'react';
import { RemoteCursorState } from '../../types/collaboration';
import { RemoteCursor } from '../collaboration/RemoteCursor';

export interface CursorOverlayProps {
  cursors: RemoteCursorState[];
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({ cursors }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {cursors.map((cursor) => (
        <RemoteCursor key={cursor.userId} cursor={cursor} />
      ))}
    </div>
  );
};
