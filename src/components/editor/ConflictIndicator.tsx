import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button';

export interface ConflictIndicatorProps {
  remoteAuthor: string;
  onOpenPanel: () => void;
}

export const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({
  remoteAuthor,
  onOpenPanel,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 mb-2 animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong className="font-bold text-amber-900">Changes Need Attention:</strong> Concurrent edit clash with <span className="underline font-semibold">{remoteAuthor}</span>.
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenPanel}
        className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 text-xs py-1 px-2.5 h-auto font-bold"
      >
        Review Conflict
      </Button>
    </div>
  );
};
