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

  const simulatedMerge = `${localContent}\n// --- AST Merged Version ---\n${remoteContent}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AST Conflict Resolution Engine" maxWidth="lg">
      <div className="space-y-5 font-sans">
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
          <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="font-medium">
            Concurrent AST node mutations detected. Review differences between your local input and remote collaborator updates.
          </p>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('side-by-side')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'side-by-side'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Side-by-Side Diff
            </button>
            <button
              onClick={() => setActiveTab('merged')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'merged'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              View Merged AST Node
            </button>
          </div>
        </div>

        {activeTab === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> YOUR VERSION
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  Local Client
                </span>
              </div>
              <div className="p-3 bg-white font-mono text-xs text-slate-800 rounded-lg min-h-[100px] whitespace-pre-wrap border border-slate-200 shadow-xs">
                {localContent || '(Empty block)'}
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-purple-600" /> OTHER VERSION ({remoteAuthor})
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  Remote User
                </span>
              </div>
              <div className="p-3 bg-white font-mono text-xs text-slate-800 rounded-lg min-h-[100px] whitespace-pre-wrap border border-slate-200 shadow-xs">
                {remoteContent || '(Empty block)'}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full bg-white border-purple-300 text-purple-800 hover:bg-purple-50 font-bold"
                icon={<Check className="w-4 h-4" />}
                onClick={() => {
                  onResolve('keep_remote');
                  onClose();
                }}
              >
                Keep Other
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <GitMerge className="w-3.5 h-3.5 text-emerald-600" /> Proposed AST AST Resolution
              </span>
            </div>
            <div className="p-3 bg-slate-900 font-mono text-xs text-emerald-300 rounded-lg min-h-[100px] whitespace-pre-wrap border border-slate-800">
              {simulatedMerge}
            </div>
            <Button
              variant="success"
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
