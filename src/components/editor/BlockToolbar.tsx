import React from 'react';
import { BlockType } from '../../types/block';
import {
  Type,
  Heading,
  Code,
  List,
  ListOrdered,
  Quote,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Plus,
} from 'lucide-react';

export interface BlockToolbarProps {
  currentType: BlockType;
  onChangeType: (type: BlockType) => void;
  onAddBelow: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
}

export const BlockToolbar: React.FC<BlockToolbarProps> = ({
  currentType,
  onChangeType,
  onAddBelow,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}) => {
  const blockTypes: { type: BlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'paragraph', label: 'Paragraph', icon: <Type className="w-3.5 h-3.5" /> },
    { type: 'heading', label: 'Heading', icon: <Heading className="w-3.5 h-3.5" /> },
    { type: 'code', label: 'Code', icon: <Code className="w-3.5 h-3.5" /> },
    { type: 'bullet-list', label: 'Bullet List', icon: <List className="w-3.5 h-3.5" /> },
    { type: 'numbered-list', label: 'Numbered List', icon: <ListOrdered className="w-3.5 h-3.5" /> },
    { type: 'quote', label: 'Quote', icon: <Quote className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-lg text-xs z-20 select-none animate-in fade-in zoom-in-95 duration-100">
      <button
        onClick={onAddBelow}
        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
        title="Add Block Below"
      >
        <Plus className="w-4 h-4 text-blue-600" />
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* Block Type Switcher */}
      <div className="flex items-center gap-0.5">
        {blockTypes.map((item) => {
          const isActive = currentType === item.type;
          return (
            <button
              key={item.type}
              onClick={() => onChangeType(item.type)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={`Turn into ${item.label}`}
            >
              {item.icon}
              <span className="hidden sm:inline font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* Reordering & Operations */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onMoveUp}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Move Up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Move Down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDuplicate}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Duplicate Block"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Delete Block"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
