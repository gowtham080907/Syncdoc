import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { DocumentPage } from './pages/DocumentPage';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { PresenceUser } from './types/collaboration';
import { Loader2, Layers } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3 font-sans">
        <div className="p-3 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-2xl text-white shadow-xl animate-pulse">
          <Layers className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          <span>Restoring SyncDoc session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const MainAppRoutes: React.FC = () => {
  const { currentUser } = useAuth();
  const [docTitle, setDocTitle] = useState<string | undefined>(undefined);
  const [simulateConflict, setSimulateConflict] = useState(false);
  const location = useLocation();

  const isEditorRoute = location.pathname.startsWith('/documents/');

  const activePresenceUser: PresenceUser = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.name,
        color: currentUser.color,
        avatar: currentUser.avatar,
        lastActive: new Date().toISOString(),
      }
    : {
        id: 'usr-guest',
        name: 'Guest Editor',
        color: '#3b82f6',
        lastActive: new Date().toISOString(),
      };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout
              documentTitle={isEditorRoute ? docTitle || 'Collaborative Document' : undefined}
              onTitleChange={(newTitle) => setDocTitle(newTitle)}
              currentUser={activePresenceUser}
              onSimulateConflict={isEditorRoute ? () => setSimulateConflict((prev) => !prev) : undefined}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="documents/:documentId"
          element={
            <DocumentPage
              onTitleLoaded={(title) => setDocTitle(title)}
              simulatedConflictTriggered={simulateConflict}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainAppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
