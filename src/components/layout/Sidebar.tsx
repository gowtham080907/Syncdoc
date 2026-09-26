import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, FileText, FolderGit2, Sparkles, Trash2, Edit3, X } from 'lucide-react';
import { DocumentMeta } from '../../types/document';
import { apiService } from '../../services/api';
import { Button } from '../common/Button';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenCreateModal,
}) => {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { documentId } = useParams<{ documentId?: string }>();
  const navigate = useNavigate();

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents in sidebar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [documentId]);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      await apiService.deleteDocument(id);
      fetchDocs();
      if (documentId === id) {
        navigate('/');
      }
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-start shadow-md bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              onOpenCreateModal();
              onClose();
            }}
          >
            New Document
          </Button>

          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-200 p-1.5 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-800/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>My Documents</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                {filteredDocs.length}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2 px-2 py-4">
                <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
                <div className="h-8 bg-slate-800/50 rounded animate-pulse" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-6 px-2 text-slate-500 text-xs">
                No documents found.
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredDocs.map((doc) => (
                  <li key={doc.id}>
                    <NavLink
                      to={`/documents/${doc.id}`}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <FileText className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-brand-400 transition-colors" />
                        <span className="truncate">{doc.title}</span>
                      </div>

                      <button
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-all rounded hover:bg-slate-700/50"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400 shrink-0 animate-pulse" />
          <span>AST Conflict Resolver Active</span>
        </div>
      </aside>
    </>
  );
};
