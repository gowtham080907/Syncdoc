import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { DocumentPage } from './pages/DocumentPage';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { PresenceUser } from './types/collaboration';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
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
        color: currentUser.color || '#3b82f6',
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
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED ROUTES IN APP LAYOUT */}
      <Route
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/documents/:documentId"
          element={
            <DocumentPage
              onTitleLoaded={(title) => setDocTitle(title)}
              simulatedConflictTriggered={simulateConflict}
            />
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
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
