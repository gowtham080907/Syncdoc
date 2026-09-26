import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CreateDocumentModal } from '../documents/CreateDocumentModal';
import { ConnectionStatus, PresenceUser } from '../../types/collaboration';

export interface AppLayoutProps {
  documentTitle?: string;
  onTitleChange?: (newTitle: string) => void;
  connectionStatus?: ConnectionStatus;
  activeUsers?: PresenceUser[];
  currentUser?: PresenceUser;
  onSimulateConflict?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  documentTitle,
  onTitleChange,
  connectionStatus = 'connected',
  activeUsers = [],
  currentUser = {
    id: 'local-user',
    name: 'Sujitha Reddy',
    color: '#4f46e5',
    lastActive: new Date().toISOString(),
  },
  onSimulateConflict,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar
        documentTitle={documentTitle}
        onTitleChange={onTitleChange}
        connectionStatus={connectionStatus}
        activeUsers={activeUsers}
        currentUser={currentUser}
        onSimulateConflict={onSimulateConflict}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex min-w-0 relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 min-w-0 pb-24">
          <Outlet />
        </main>
      </div>

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
