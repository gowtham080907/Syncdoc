import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Clock, Trash2, Edit2, Star } from 'lucide-react';
import { DocumentMeta } from '../../types/document';

export interface DocumentCardProps {
  document: DocumentMeta;
  onDelete: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onStarToggle?: (id: string, isStarred?: boolean) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDelete,
  onRename,
  onStarToggle,
}) => {
  const formattedDate = new Date(document.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const ownerName = document.owner?.name || (document as any).author?.name || 'Sujitha Reddy';
  const ownerAvatar = document.owner?.avatar || (document as any).author?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileText className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onStarToggle && onStarToggle(document.id, document.isStarred)}
              className={`p-1.5 rounded transition-colors ${
                document.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
              }`}
              title={document.isStarred ? 'Unstar Document' : 'Star Document'}
            >
              <Star className={`w-4 h-4 ${document.isStarred ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => onRename(document.id, document.title)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
              title="Rename Document"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(document.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Link to={`/documents/${document.id}`} className="block">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {document.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {document.description || 'No description provided.'}
          </p>
        </Link>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2" title={`Owner: ${ownerName}`}>
          <img
            src={ownerAvatar}
            alt={ownerName}
            className="w-5 h-5 rounded-full object-cover border border-slate-200"
          />
          <span className="truncate max-w-[90px] font-medium">{ownerName}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Active collaborators">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-700">{document.activeUsersCount || 1}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
