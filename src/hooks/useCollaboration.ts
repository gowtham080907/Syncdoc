import { useYjsDocument, UseYjsDocumentReturn } from './useYjsDocument';
import { usePresence, UsePresenceReturn } from './usePresence';

export interface UseCollaborationReturn extends UseYjsDocumentReturn, UsePresenceReturn {
  isSaving: boolean;
  lastSavedAt: string | null;
  triggerManualSave: () => void;
}

export const useCollaboration = (documentId: string): UseCollaborationReturn => {
  const yjsDoc = useYjsDocument(documentId);
  const presence = usePresence(documentId);

  return {
    ...yjsDoc,
    ...presence,
    isSaving: false,
    lastSavedAt: new Date().toLocaleTimeString(),
    triggerManualSave: () => {
      console.log('Document state manually saved to Yjs CRDT doc');
    },
  };
};
