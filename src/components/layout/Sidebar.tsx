import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Search, FileText, LayoutDashboard, Clock, Users, Star, Settings as SettingsIcon, Trash2, X, Sparkles } from 'lucide-react';
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
  const location = useLocation();
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
        navigate('/dashboard');
      }
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Recent', icon: Clock, path: '/dashboard?filter=recent' },
    { label: 'Shared With Me', icon: Users, path: '/dashboard?filter=shared' },
    { label: 'Starred', icon: Star, path: '/dashboard?filter=starred' },
    { label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky md:top-16 inset-y-0 left-0 z-40 w-64 md:h-[calc(100vh-4rem)] bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out shadow-sm font-sans ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Create Document Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
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
            className="md:hidden text-slate-500 hover:text-slate-900 p-1.5 ml-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-xs font-medium text-slate-800 pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-colors shadow-none"
            />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname + location.search === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard' && !location.search);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Documents</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {filteredDocs.length}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2 px-2 py-2">
                <div className="h-7 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-7 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-7 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-4 px-2 text-slate-400 text-xs font-medium">
                No documents found.
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredDocs.map((doc) => {
                  const isCurrentDoc = documentId === doc.id;
                  return (
                    <li key={doc.id}>
                      <NavLink
                        to={`/documents/${doc.id}`}
                        onClick={onClose}
                        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isCurrentDoc
                            ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FileText className={`w-4 h-4 shrink-0 ${isCurrentDoc ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                          <span className="truncate">{doc.title}</span>
                        </div>

                        <button
                          onClick={(e) => handleDelete(e, doc.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all rounded-lg hover:bg-slate-200/60"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Status Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-semibold text-[11px]">SyncDoc AST Engine Active</span>
        </div>
      </aside>
    </>
  );
};
