import React from 'react';

export interface SelectionOverlayProps {
  color?: string;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ color = '#3b82f6' }) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-20 transition-opacity"
      style={{ backgroundColor: color }}
    />
  );
};
