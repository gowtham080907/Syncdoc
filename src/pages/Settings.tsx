import React, { useState } from 'react';
import { Sliders, User, Lock, Monitor, Users, Eye, Check, ShieldCheck } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'editor' | 'collaboration'>('account');

  // Account State
  const [emailNotification, setEmailNotification] = useState(true);

  // Editor State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [autoSaveInterval, setAutoSaveInterval] = useState('2');

  // Collaboration State
  const [showRemoteCursors, setShowRemoteCursors] = useState(true);
  const [showUserPresence, setShowUserPresence] = useState(true);
  const [showEditingIndicators, setShowEditingIndicators] = useState(true);

  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('Settings saved successfully!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Settings</h1>
        <p className="text-xs text-slate-500">Configure account preferences, block editor behavior, and real-time collaboration options</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'account'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          ACCOUNT
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'editor'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4" />
          EDITOR
        </button>

        <button
          onClick={() => setActiveTab('collaboration')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'collaboration'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          COLLABORATION
        </button>
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Account & Security</h3>
              <p className="text-xs text-slate-500">Manage profile credentials and notifications</p>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Email Notifications</div>
                  <div className="text-xs text-slate-500">Receive email alerts when invited to document rooms</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotification}
                  onChange={(e) => setEmailNotification(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Password & Security</div>
                  <div className="text-xs text-slate-500">Authentication is delegated to Team Member 4</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert('Password modification endpoint managed by Database & Auth team.')}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* EDITOR TAB */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Editor Preferences</h3>
              <p className="text-xs text-slate-500">Customize block editor typography and rendering</p>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Editor Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 p-2.5 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="light">Light-first (Recommended)</option>
                    <option value="dark">Dark Theme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Default Font Size
                  </label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value as any)}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 p-2.5 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="sm">Small (13px)</option>
                    <option value="md">Medium (15px Default)</option>
                    <option value="lg">Large (17px)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COLLABORATION TAB */}
        {activeTab === 'collaboration' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Real-Time Collaboration Features</h3>
              <p className="text-xs text-slate-500">Control remote visual overlays and presence indicators</p>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">Show Remote Cursors</div>
                  <div className="text-xs text-slate-500">Render live remote user cursors and text selections inside active blocks</div>
                </div>
                <input
                  type="checkbox"
                  checked={showRemoteCursors}
                  onChange={(e) => setShowRemoteCursors(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">Show User Presence</div>
                  <div className="text-xs text-slate-500">Display active collaborator avatars and presence badges in top navbar</div>
                </div>
                <input
                  type="checkbox"
                  checked={showUserPresence}
                  onChange={(e) => setShowUserPresence(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">Show Editing Indicators</div>
                  <div className="text-xs text-slate-500">Highlight blocks currently being edited by other team members</div>
                </div>
                <input
                  type="checkbox"
                  checked={showEditingIndicators}
                  onChange={(e) => setShowEditingIndicators(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
