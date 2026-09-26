import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertOctagon, Check, GitMerge, User, GitBranch } from 'lucide-react';
import { ConflictResolutionChoice } from '../../types/ast';

export interface ConflictPanelProps {
  isOpen: boolean;
  onClose: () => void;
  localContent: string;
  remoteContent: string;
  remoteAuthor: string;
  onResolve: (choice: ConflictResolutionChoice, mergedText?: string) => void;
}

export const ConflictPanel: React.FC<ConflictPanelProps> = ({
  isOpen,
  onClose,
  localContent,
  remoteContent,
  remoteAuthor,
  onResolve,
}) => {
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'merged'>('side-by-side');

  const simulatedMerge = `${localContent}\n// --- AST Concurrent Merge ---\n${remoteContent}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AST Conflict Resolution Engine" maxWidth="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3.5 bg-amber-950/60 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
          <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0" />
          <p>
            Concurrent AST node mutations detected. Select which version to apply to the CRDT document state or inspect the merged node tree.
          </p>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('side-by-side')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'side-by-side'
                  ? 'bg-slate-800 text-brand-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side Diff
            </button>
            <button
              onClick={() => setActiveTab('merged')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'merged'
                  ? 'bg-slate-800 text-brand-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              View Merged AST Node
            </button>
          </div>
        </div>

        {activeTab === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Your Local Version
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  Current Client
                </span>
              </div>
              <div className="p-3 bg-slate-900 font-mono text-xs text-slate-200 rounded-lg min-h-[100px] whitespace-pre-wrap border border-slate-800">
                {localContent || '(Empty block)'}
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                icon={<Check className="w-4 h-4" />}
                onClick={() => {
                  onResolve('keep_mine');
                  onClose();
                }}
              >
                Keep Mine
              </Button>
            </div>

            {/* Remote Version */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" /> Remote ({remoteAuthor})
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  Peer Delta
                </span>
              </div>
              <div className="p-3 bg-slate-900 font-mono text-xs text-slate-200 rounded-lg min-h-[100px] whitespace-pre-wrap border border-slate-800">
                {remoteContent || '(Empty block)'}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full border-purple-500/40 text-purple-200 hover:bg-purple-950/40"
                icon={<Check className="w-4 h-4" />}
                onClick={() => {
                  onResolve('keep_remote');
                  onClose();
                }}
              >
                Keep Remote
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <GitMerge className="w-3.5 h-3.5" /> Proposed AST AST Resolution
              </span>
            </div>
            <div className="p-3 bg-slate-900 font-mono text-xs text-emerald-300 rounded-lg min-h-[100px] whitespace-pre-wrap border border-slate-800">
              {simulatedMerge}
            </div>
            <Button
              variant="success"
              size="sm"
              className="w-full"
              icon={<GitMerge className="w-4 h-4" />}
              onClick={() => {
                onResolve('merged', simulatedMerge);
                onClose();
              }}
            >
              Apply Merged Resolution
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
