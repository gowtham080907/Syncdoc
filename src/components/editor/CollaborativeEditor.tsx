import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollaboration } from '../../hooks/useCollaboration';
import { apiService } from '../../services/api';
import { DocumentDetail } from '../../types/document';
import { BlockEditor } from './BlockEditor';
import { ASTTreeViewer } from './ASTTreeViewer';
import { SimulatedCollaborationController } from '../collaboration/SimulatedCollaborationController';
import { Loading } from '../common/Loading';
import { AlertCircle, ArrowLeft, Share2, Sparkles, Database, Check } from 'lucide-react';
import { Button } from '../common/Button';

export interface CollaborativeEditorProps {
  onTitleLoaded?: (title: string) => void;
  simulatedConflictTriggered?: boolean;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  onTitleLoaded,
  simulatedConflictTriggered = false,
}) => {
  const { documentId = 'doc-1' } = useParams<{ documentId?: string }>();
  const [docMeta, setDocMeta] = useState<DocumentDetail | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  const collaboration = useCollaboration(documentId);
  const {
    blocks,
    connectionStatus,
    updateBlockContent,
    updateBlockMetadata,
    changeBlockType,
    addBlock,
    deleteBlock,
    reorderBlocks,
    getUserEditingBlock,
  } = collaboration;

  const [activeConflictBlockId, setActiveConflictBlockId] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<{
    remoteContent: string;
    remoteAuthor: string;
    timestamp: string;
  } | undefined>(undefined);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocDetail = async () => {
      try {
        setIsLoadingDoc(true);
        setDocError(null);
        const detail = await apiService.getDocument(documentId);
        setDocMeta(detail);
        if (onTitleLoaded) onTitleLoaded(detail.title);
      } catch (err) {
        setDocError('Failed to load document content.');
      } finally {
        setIsLoadingDoc(false);
      }
    };

    fetchDocDetail();
  }, [documentId, onTitleLoaded]);

  // Trigger simulated AST conflict when button in navbar is clicked
  useEffect(() => {
    if (simulatedConflictTriggered && blocks.length > 0) {
      const targetId = blocks[0].id;
      setActiveConflictBlockId(targetId);
      setConflictData({
        remoteContent: `${blocks[0].content} (Modified concurrently by Alex Rivera)`,
        remoteAuthor: 'Alex Rivera',
        timestamp: new Date().toLocaleTimeString(),
      });
    } else {
      setActiveConflictBlockId(null);
      setConflictData(undefined);
    }
  }, [simulatedConflictTriggered, blocks]);

  if (isLoadingDoc) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading label="Initializing Yjs CRDT session & AST document tree..." size="lg" />
      </div>
    );
  }

  if (docError || !docMeta) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-100 mb-2">Error Loading Document</h3>
        <p className="text-sm text-slate-400 mb-6">{docError || 'Document not found.'}</p>
        <Button variant="primary" onClick={() => navigate('/')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full relative">
      {/* Editor Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80">
        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            {docMeta.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {docMeta.description || 'Collaborative technical specification engine.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Share2 className="w-4 h-4 text-brand-400" />}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Document share URL copied to clipboard!');
            }}
          >
            Share Room
          </Button>
        </div>
      </div>

      {/* Live Concurrent Edits Demo Controller (Use Case from Image 1 & 2) */}
      <SimulatedCollaborationController
        blocks={blocks}
        addBlock={addBlock}
        updateBlockContent={updateBlockContent}
        onSimulateConcurrentUsers={() => {
          if (blocks.length > 0) {
            // Trigger temporary visual badge for live demo
          }
        }}
      />

      {/* Main Block Workspace */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 md:p-8 shadow-2xl relative">
        <BlockEditor
          blocks={blocks}
          addBlock={addBlock}
          updateBlockContent={updateBlockContent}
          updateBlockMetadata={updateBlockMetadata}
          changeBlockType={changeBlockType}
          deleteBlock={deleteBlock}
          reorderBlocks={reorderBlocks}
          getUserEditingBlock={getUserEditingBlock}
          activeConflictBlockId={activeConflictBlockId}
          conflictData={conflictData}
        />
      </div>

      {/* Live AST Node Inspector for Backend AST Team Integration */}
      <ASTTreeViewer blocks={blocks} />
    </div>
  );
};
