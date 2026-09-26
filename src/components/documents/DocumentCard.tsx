import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Clock, Trash2, Edit2, Layers } from 'lucide-react';
import { DocumentMeta } from '../../types/document';

export interface DocumentCardProps {
  document: DocumentMeta;
  onDelete: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDelete,
  onRename,
}) => {
  const formattedDate = new Date(document.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-xl p-5 shadow-lg hover:shadow-brand-500/5 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2.5 bg-slate-800/80 rounded-lg text-brand-400 group-hover:bg-brand-500/10 group-hover:text-brand-300 transition-colors">
            <FileText className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onRename(document.id, document.title)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Rename Document"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(document.id)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Link to={`/documents/${document.id}`} className="block">
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
            {document.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {document.description || 'No description provided.'}
          </p>
        </Link>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <img
            src={document.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
            alt={document.author.name}
            className="w-5 h-5 rounded-full object-cover border border-slate-700"
          />
          <span className="truncate max-w-[90px]">{document.author.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Active collaborators">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{document.activeUsersCount || 1}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
