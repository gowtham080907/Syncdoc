import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocumentMeta, DocumentFilter } from '../../types/document';
import { apiService } from '../../services/api';
import { DocumentList } from './DocumentList';
import { CreateDocumentModal } from './CreateDocumentModal';
import { Search, Plus, Sparkles, Filter, Clock, Users, Star } from 'lucide-react';
import { Button } from '../common/Button';

export const DocumentBrowser: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = (searchParams.get('filter') as DocumentFilter) || 'all';

  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await apiService.deleteDocument(id);
      fetchDocs();
    }
  };

  const handleRename = async (id: string, currentTitle: string) => {
    const newTitle = window.prompt('Enter new document title:', currentTitle);
    if (newTitle && newTitle.trim() !== currentTitle) {
      await apiService.updateDocument(id, { title: newTitle.trim() });
      fetchDocs();
    }
  };

  const handleStarToggle = async (id: string, isStarred?: boolean) => {
    await apiService.updateDocument(id, { isStarred: !isStarred });
    fetchDocs();
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterParam === 'recent') return true;
    if (filterParam === 'shared') return doc.isShared || (doc.collaborators && doc.collaborators.length > 0);
    if (filterParam === 'starred') return doc.isStarred;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" /> Real-time CRDT Document Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Document Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage collaborative technical specifications and concurrent AST document structures.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-5 h-5" />}
          className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-bold"
        >
          New Document
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto border-b md:border-b-0 border-slate-200 pb-2 md:pb-0 overflow-x-auto">
          <button
            onClick={() => setSearchParams({ filter: 'all' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterParam === 'all'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setSearchParams({ filter: 'recent' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterParam === 'recent'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Recent
          </button>
          <button
            onClick={() => setSearchParams({ filter: 'shared' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterParam === 'shared'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Shared With Me
          </button>
          <button
            onClick={() => setSearchParams({ filter: 'starred' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterParam === 'starred'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" /> Starred
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-xs text-slate-900 pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-none transition-colors shadow-none"
          />
        </div>
      </div>

      {/* Document Grid */}
      <DocumentList
        documents={filteredDocs}
        isLoading={isLoading}
        onDelete={handleDelete}
        onRename={handleRename}
        onStarToggle={handleStarToggle}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
