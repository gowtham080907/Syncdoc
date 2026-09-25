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
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-950/80 border border-amber-500/40 rounded-lg text-xs text-amber-200 mb-2 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="font-semibold text-amber-300">AST Conflict Detected:</strong> Concurrent edit clash with <span className="underline">{remoteAuthor}</span>.
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenPanel}
        className="border-amber-500/50 text-amber-300 hover:bg-amber-900/60 text-xs py-1 px-2.5 h-auto"
      >
        Resolve Conflict
      </Button>
    </div>
  );
};
