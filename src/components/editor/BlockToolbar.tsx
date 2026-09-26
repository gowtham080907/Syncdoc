import React from 'react';
import { BlockType } from '../../types/block';
import {
  Type,
  Heading,
  Code,
  List,
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
    { type: 'code', label: 'Code Block', icon: <Code className="w-3.5 h-3.5" /> },
    { type: 'quote', label: 'Quote', icon: <Quote className="w-3.5 h-3.5" /> },
    { type: 'list', label: 'List Item', icon: <List className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-1 shadow-xl text-xs z-20 select-none animate-in fade-in zoom-in-95 duration-100">
      <button
        onClick={onAddBelow}
        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        title="Add Block Below"
      >
        <Plus className="w-4 h-4 text-brand-400" />
      </button>

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Block Type Switcher */}
      <div className="flex items-center gap-0.5">
        {blockTypes.map((item) => {
          const isActive = currentType === item.type;
          return (
            <button
              key={item.type}
              onClick={() => onChangeType(item.type)}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={`Turn into ${item.label}`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Reordering & Operations */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onMoveUp}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Move Up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Move Down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDuplicate}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Duplicate Block"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
          title="Delete Block"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
