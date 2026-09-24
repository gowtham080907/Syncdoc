import React from 'react';
import { DocumentBlock } from '../../../types/block';
import { Code2, ChevronDown } from 'lucide-react';

export interface CodeBlockProps {
  block: DocumentBlock;
  isFocused: boolean;
  onFocus: () => void;
  onChangeContent: (newContent: string) => void;
  onChangeLanguage: (newLanguage: string) => void;
  onBackspaceOnEmpty: () => void;
}

const LANGUAGES = ['typescript', 'javascript', 'python', 'json', 'html', 'css', 'go', 'rust', 'sql'];

export const CodeBlock: React.FC<CodeBlockProps> = React.memo(({
  block,
  isFocused,
  onFocus,
  onChangeContent,
  onChangeLanguage,
  onBackspaceOnEmpty,
}) => {
  const currentLang = block.metadata?.language || 'typescript';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = block.content.substring(0, start) + '  ' + block.content.substring(end);
      onChangeContent(newContent);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault();
      onBackspaceOnEmpty();
    }
  };

  return (
    <div className="relative my-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group focus-within:border-blue-500 transition-colors shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300">Code Block</span>
        </div>

        <div className="relative flex items-center">
          <select
            value={currentLang}
            onChange={(e) => onChangeLanguage(e.target.value)}
            className="bg-slate-800 text-slate-200 text-[11px] font-mono pl-2.5 pr-6 py-1 rounded border border-slate-700 hover:border-slate-600 outline-none appearance-none cursor-pointer font-semibold"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 pointer-events-none text-slate-400" />
        </div>
      </div>

      <textarea
        id={`block-content-${block.id}`}
        value={block.content}
        onFocus={onFocus}
        onChange={(e) => onChangeContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="// Enter source code here..."
        rows={Math.max(2, block.content.split('\n').length)}
        className="w-full bg-slate-900 text-emerald-400 font-mono text-sm p-3.5 outline-none resize-none leading-relaxed selection:bg-blue-600 selection:text-white"
      />
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
