import React, { useState } from 'react';
import { DocumentBlock } from '../../types/block';
import { convertBlocksToASTDoc } from '../../utils/astUtils';
import { Code, Copy, Check, Terminal, Eye, EyeOff } from 'lucide-react';
import { Button } from '../common/Button';

export interface ASTTreeViewerProps {
  blocks: DocumentBlock[];
}

export const ASTTreeViewer: React.FC<ASTTreeViewerProps> = ({ blocks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const astDoc = convertBlocksToASTDoc(blocks);
  const jsonString = JSON.stringify(astDoc, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="mt-6 border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            AST Node Tree Inspector (Backend Contract)
          </h3>
          <span className="text-[10px] font-mono bg-brand-500/10 text-brand-300 border border-brand-500/20 px-2 py-0.5 rounded-full">
            {blocks.length} Structural Nodes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              icon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-slate-400 hover:text-slate-200 text-xs py-1 px-2.5"
            >
              {isCopied ? 'Copied' : 'Copy JSON'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            icon={isOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-brand-400" />}
            className="text-xs py-1 px-2.5 border-slate-700"
          >
            {isOpen ? 'Hide AST JSON' : 'Inspect AST Structure'}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-slate-950 max-h-80 overflow-y-auto">
          <pre className="font-mono text-xs text-brand-300 leading-relaxed whitespace-pre-wrap select-all">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
