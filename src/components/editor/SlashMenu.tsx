import React, { useEffect, useRef } from 'react';
import { BlockType } from '../../types/block';
import { Type, Heading, Code, List, ListOrdered, Quote } from 'lucide-react';

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
      icon: <Type className="w-4 h-4 text-blue-600" />,
    },
    {
      type: 'heading',
      label: 'Heading',
      desc: 'Large section header title',
      icon: <Heading className="w-4 h-4 text-indigo-600" />,
    },
    {
      type: 'code',
      label: 'Code Block',
      desc: 'Syntax highlighted code snippet',
      icon: <Code className="w-4 h-4 text-emerald-600" />,
    },
    {
      type: 'bullet-list',
      label: 'Bulleted List',
      desc: 'Simple bullet list item',
      icon: <List className="w-4 h-4 text-rose-600" />,
    },
    {
      type: 'numbered-list',
      label: 'Numbered List',
      desc: 'Ordered list sequence item',
      icon: <ListOrdered className="w-4 h-4 text-amber-600" />,
    },
    {
      type: 'quote',
      label: 'Quote',
      desc: 'Highlighted blockquote callout',
      icon: <Quote className="w-4 h-4 text-purple-600" />,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute z-50 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
        Insert Block Type
      </div>
      <div className="p-1 space-y-0.5">
        {items.map((item) => (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div className="p-2 bg-slate-100 group-hover:bg-blue-50 rounded-md transition-colors">
              {item.icon}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-500">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
