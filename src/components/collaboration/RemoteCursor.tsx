import React from 'react';
import { RemoteCursorState } from '../../types/collaboration';

export interface RemoteCursorProps {
  cursor: RemoteCursorState;
}

export const RemoteCursor: React.FC<RemoteCursorProps> = ({ cursor }) => {
  if (!cursor.coords) return null;

  return (
    <div
      className="pointer-events-none absolute z-30 transition-all duration-100 ease-out"
      style={{
        top: `${cursor.coords.top}px`,
        left: `${cursor.coords.left}px`,
      }}
    >
      {/* Caret Line */}
      <div
        className="w-0.5 rounded-full animate-pulse"
        style={{
          backgroundColor: cursor.userColor,
          height: `${cursor.coords.height || 20}px`,
        }}
      />

      {/* User Label Badge */}
      <div
        className="absolute left-1 -top-5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap shadow-md flex items-center gap-1"
        style={{ backgroundColor: cursor.userColor }}
      >
        <span>{cursor.userName}</span>
      </div>
    </div>
  );
};
