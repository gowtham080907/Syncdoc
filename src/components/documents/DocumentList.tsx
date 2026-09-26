import React from 'react';
import { DocumentMeta } from '../../types/document';
import { DocumentCard } from './DocumentCard';
import { Loading } from '../common/Loading';
import { FileText, Plus } from 'lucide-react';
import { Button } from '../common/Button';

export interface DocumentListProps {
  documents: DocumentMeta[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onCreateNew: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onDelete,
  onRename,
  onCreateNew,
}) => {
  if (isLoading) {
    return <Loading label="Fetching documents..." size="lg" />;
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
        <div className="p-4 bg-slate-800/60 rounded-full text-slate-400 mb-4">
          <FileText className="w-8 h-8 text-brand-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">No documents found</h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">
          Create your first collaborative document with AST conflict resolution engine.
        </p>
        <Button
          variant="primary"
          onClick={onCreateNew}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Document
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          onRename={onRename}
        />
      ))}
    </div>
  );
};
