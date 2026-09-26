import React, { useState } from 'react';
import { DocumentBlock } from '../../types/block';
import { convertBlocksToASTDoc } from '../../utils/astUtils';
import { Copy, Check, Terminal, Eye, EyeOff } from 'lucide-react';
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
    <div className="mt-8 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm font-sans">
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            AST Node Tree Inspector (Member 3 Contract)
          </h3>
          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
            {blocks.length} Structural Nodes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              icon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-slate-600 hover:text-slate-900 text-xs py-1 px-2.5"
            >
              {isCopied ? 'Copied' : 'Copy JSON'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            icon={isOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
            className="text-xs py-1 px-2.5 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
          >
            {isOpen ? 'Hide AST JSON' : 'Inspect AST Structure'}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-slate-900 max-h-80 overflow-y-auto">
          <pre className="font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap select-all">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
