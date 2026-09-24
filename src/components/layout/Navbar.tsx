import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ConnectionStatus, PresenceUser } from '../../types/collaboration';
import { ActiveUsers } from '../collaboration/ActiveUsers';
import { FileText, CheckCircle2, Wifi, AlertOctagon, CloudOff, Layers, Sliders, User as UserIcon, UserPlus, LogOut, RefreshCw, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from '../profile/UserProfileModal';
import { AddEditorModal } from '../profile/AddEditorModal';

export interface NavbarProps {
  documentTitle?: string;
  onTitleChange?: (newTitle: string) => void;
  connectionStatus: ConnectionStatus;
  activeUsers: PresenceUser[];
  currentUser: PresenceUser;
  onSimulateConflict?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  documentTitle,
  onTitleChange,
  connectionStatus,
  activeUsers,
  currentUser: presenceUser,
  onSimulateConflict,
  onToggleSidebar,
}) => {
  const { currentUser, editors, switchEditor, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddEditorModalOpen, setIsAddEditorModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Wifi className="w-3.5 h-3.5" />
            <span>Connected</span>
          </div>
        );
      case 'connecting':
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Syncing...</span>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-950/80 border border-rose-800/80 px-3 py-1 rounded-full">
            <CloudOff className="w-3.5 h-3.5" />
            <span>Disconnected</span>
          </div>
        );
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-40 select-none shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Toggle Navigation Sidebar"
        >
          <Sliders className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-white hover:opacity-95 transition-opacity shrink-0">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/30">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-black tracking-tight text-white text-lg">
            Sync<span className="text-indigo-400">Doc</span>
          </span>
        </Link>

        {documentTitle !== undefined && (
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-sm min-w-0">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold focus:bg-slate-800 px-2 py-1 rounded border border-transparent focus:border-slate-700 outline-none transition-colors truncate"
              placeholder="Untitled Document"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {documentTitle !== undefined && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Yjs CRDT Synced</span>
          </div>
        )}

        {getStatusBadge()}

        {onSimulateConflict && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSimulateConflict}
            icon={<AlertOctagon className="w-3.5 h-3.5 text-amber-400" />}
            className="hidden sm:inline-flex border-amber-800/80 bg-amber-950/40 text-amber-200 hover:bg-amber-900/60 font-semibold text-xs"
          >
            Simulate AST Conflict
          </Button>
        )}

        <ActiveUsers activeUsers={activeUsers} currentUser={presenceUser} />

        {/* User Profile & Menu Dropdown */}
        <div className="relative pl-2 border-l border-slate-800" ref={dropdownRef}>
          {currentUser ? (
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/50 shadow-sm"
                style={{ backgroundColor: currentUser.color || '#4f46e5' }}
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-200 truncate max-w-[110px]">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
              Log In
            </Button>
          )}

          {isDropdownOpen && currentUser && (
            <div className="absolute right-0 top-12 z-50 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500 shrink-0 shadow-sm"
                  style={{ backgroundColor: currentUser.color || '#4f46e5' }}
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{currentUser.name}</h4>
                  <span className="text-[10px] text-indigo-400 font-semibold block truncate">{currentUser.role || 'Member'}</span>
                </div>
              </div>

              {/* Persona Switcher Section */}
              <div className="p-2 border-b border-slate-800">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-indigo-400" /> Switch Collaborator
                </div>
                <div className="space-y-0.5 mt-1 max-h-36 overflow-y-auto">
                  {editors.map((editor) => {
                    const isSelected = editor.id === currentUser.id;
                    return (
                      <button
                        key={editor.id}
                        onClick={() => {
                          switchEditor(editor.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? 'bg-indigo-950/80 text-indigo-300 font-bold border border-indigo-700/60'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: editor.color }}
                          />
                          <span className="truncate">{editor.name}</span>
                        </div>
                        {isSelected && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="p-1.5 space-y-0.5 text-xs">
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={() => {
                    setIsAddEditorModalOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
                >
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span>Add Team Member</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <AddEditorModal
        isOpen={isAddEditorModalOpen}
        onClose={() => setIsAddEditorModalOpen(false)}
      />
    </header>
  );
};
