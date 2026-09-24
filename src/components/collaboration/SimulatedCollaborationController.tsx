import React, { useState } from 'react';
import { Play, Zap } from 'lucide-react';
import { Button } from '../common/Button';
import { DocumentBlock, BlockType } from '../../types/block';

export interface SimulatedCollaborationControllerProps {
  blocks: DocumentBlock[];
  addBlock: (type?: BlockType, content?: string, afterId?: string) => DocumentBlock;
  updateBlockContent: (id: string, content: string) => void;
  onSimulateConcurrentUsers: () => void;
}

export const SimulatedCollaborationController: React.FC<SimulatedCollaborationControllerProps> = ({
  blocks,
  addBlock,
  updateBlockContent,
  onSimulateConcurrentUsers,
}) => {
  const [isRunningSim, setIsRunningSim] = useState(false);

  const handleRunUsecaseDemo = () => {
    setIsRunningSim(true);

    onSimulateConcurrentUsers();

    // Step 1: User A (Sree V) types in paragraph block
    if (blocks.length > 1) {
      const b1 = blocks[1];
      let charIdx = 0;
      const textToType = ' [User A added: Live AST CRDT concurrency check verified.]';

      const intervalA = setInterval(() => {
        if (charIdx < textToType.length) {
          updateBlockContent(b1.id, b1.content + textToType.slice(0, charIdx + 1));
          charIdx++;
        } else {
          clearInterval(intervalA);
        }
      }, 80);
    }

    // Step 2: Concurrently User B (Rahul) adds a code block
    setTimeout(() => {
      addBlock('code', '// User B added code block concurrently\nfunction solveConflict(ast1, ast2) {\n  return Y.merge(ast1, ast2);\n}', blocks[blocks.length - 1]?.id);
      setTimeout(() => setIsRunningSim(false), 2500);
    }, 600);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-blue-200 rounded-2xl shadow-sm my-4 font-sans">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
            Use Case Demonstration (User A & User B Concurrent Edits)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate User A typing a paragraph while User B concurrently inserts a code block without input corruption or full document rebuilds.
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        isLoading={isRunningSim}
        onClick={handleRunUsecaseDemo}
        icon={<Play className="w-3.5 h-3.5 fill-current" />}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 shrink-0 shadow-xs"
      >
        {isRunningSim ? 'Simulating Concurrent Edits...' : 'Run Use Case Demo'}
      </Button>
    </div>
  );
};
