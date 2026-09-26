import React, { useState } from 'react';
import { Play, Pause, Users, CheckCircle2, Zap } from 'lucide-react';
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

    // Call callback to trigger visual presence indicators
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

    // Step 2: Concurrently User B (Alex Rivera) adds a code block lower down the page
    setTimeout(() => {
      const codeBlock = addBlock('code', '// User B added code block concurrently\nfunction solveConflict(ast1, ast2) {\n  return Y.merge(ast1, ast2);\n}', blocks[blocks.length - 1]?.id);
      console.log('User B added code block:', codeBlock.id);
      setTimeout(() => setIsRunningSim(false), 2500);
    }, 600);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-brand-500/30 rounded-2xl shadow-lg my-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
          <Zap className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Use Case Demonstration (User A & User B Concurrent Edits)
          </h4>
          <p className="text-xs text-slate-400">
            Simulate User A typing a paragraph while User B concurrently inserts a code block without text corruption or DOM layout rebuilds.
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        isLoading={isRunningSim}
        onClick={handleRunUsecaseDemo}
        icon={<Play className="w-3.5 h-3.5 fill-current" />}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs py-2 px-3 shrink-0"
      >
        {isRunningSim ? 'Simulating Concurrent Edits...' : 'Run Use Case Demo'}
      </Button>
    </div>
  );
};
