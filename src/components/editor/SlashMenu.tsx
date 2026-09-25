import React, { useEffect, useRef } from 'react';
import { BlockType } from '../../types/block';
import { Type, Heading, Code, List, Quote } from 'lucide-react';

export interface SlashMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const items: { type: BlockType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      type: 'paragraph',
      label: 'Paragraph',
      desc: 'Plain text paragraph block',
      icon: <Type className="w-4 h-4 text-brand-400" />,
    },
    {
      type: 'heading',
      label: 'Heading',
      desc: 'Large title or section header',
      icon: <Heading className="w-4 h-4 text-indigo-400" />,
    },
    {
      type: 'code',
      label: 'Code Block',
      desc: 'Syntax highlighted code snippet',
      icon: <Code className="w-4 h-4 text-emerald-400" />,
    },
    {
      type: 'quote',
      label: 'Quote',
      desc: 'Highlighted blockquote or callout',
      icon: <Quote className="w-4 h-4 text-amber-400" />,
    },
    {
      type: 'list',
      label: 'Bulleted List',
      desc: 'Simple bulleted list item',
      icon: <List className="w-4 h-4 text-pink-400" />,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute z-50 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/60">
        Insert Block Type
      </div>
      <div className="p-1 space-y-0.5">
        {items.map((item) => (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-slate-800/80 transition-colors group"
          >
            <div className="p-2 bg-slate-800 group-hover:bg-slate-700 rounded-md transition-colors">
              {item.icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-brand-300">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-400">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
