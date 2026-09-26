import React from 'react';
import { CollaborativeEditor } from '../components/editor/CollaborativeEditor';

export interface DocumentPageProps {
  onTitleLoaded?: (title: string) => void;
  simulatedConflictTriggered?: boolean;
}

export const DocumentPage: React.FC<DocumentPageProps> = ({
  onTitleLoaded,
  simulatedConflictTriggered,
}) => {
  return (
    <CollaborativeEditor
      onTitleLoaded={onTitleLoaded}
      simulatedConflictTriggered={simulatedConflictTriggered}
    />
  );
};

export default DocumentPage;
