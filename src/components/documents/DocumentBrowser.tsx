import React, { useState, useEffect } from 'react';
import { DocumentMeta } from '../../types/document';
import { apiService } from '../../services/api';
import { DocumentList } from './DocumentList';
import { CreateDocumentModal } from './CreateDocumentModal';
import { Search, Plus, Sparkles, Filter } from 'lucide-react';
import { Button } from '../common/Button';

export const DocumentBrowser: React.FC = () => {
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

  const filteredDocs = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Real-time CRDT Document Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Document Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage collaborative technical specifications and concurrent AST document structures.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-5 h-5" />}
          className="shadow-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500"
        >
          New Document
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, description or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 text-sm text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-brand-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Showing {filteredDocs.length} documents</span>
        </div>
      </div>

      {/* Document Grid */}
      <DocumentList
        documents={filteredDocs}
        isLoading={isLoading}
        onDelete={handleDelete}
        onRename={handleRename}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
