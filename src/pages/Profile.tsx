import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, AtSign, Shield, Camera, Edit3, Check, Save, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Profile: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || currentUser?.id || '');
  const [role, setRole] = useState(currentUser?.role || 'Computer Science Engineering');
  const [about, setAbout] = useState(currentUser?.about || currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please sign in to view your profile.
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      username,
      role,
      about,
      avatar,
      bio: about,
    });
    setIsEditing(false);
    setStatusMessage('Profile updated successfully!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 h-40 rounded-2xl relative shadow-md">
        <div className="absolute -bottom-10 left-8 flex items-end gap-4">
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-xl flex items-center justify-center text-white font-bold text-2xl bg-blue-600"
              style={{ backgroundColor: currentUser.color || '#3b82f6' }}
            >
              {avatar || currentUser.avatar ? (
                <img src={avatar || currentUser.avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => {
                  const url = prompt('Enter image URL for avatar:', avatar);
                  if (url !== null) setAvatar(url);
                }}
                className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change Avatar"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {currentUser.name}
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white inline-block" title="Online" />
            </h1>
            <p className="text-xs text-slate-500 font-medium">@{currentUser.username || currentUser.id}</p>
          </div>
        </div>
      </div>

      <div className="pt-8 flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">User Identity</span>
          <p className="text-xs text-slate-500">Shared across real-time presence, remote cursors, and conflict indicators</p>
        </div>

        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            icon={<Edit3 className="w-4 h-4" />}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              icon={<Save className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Profile Form / Details */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Full Name
            </label>
            {isEditing ? (
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 text-sm text-slate-900 pl-10 pr-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-sm font-semibold text-slate-800 border border-slate-100">
                {currentUser.name}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Username
            </label>
            {isEditing ? (
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 text-sm text-slate-900 pl-10 pr-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-sm font-semibold text-slate-800 border border-slate-100">
                @{currentUser.username || currentUser.id}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 border border-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{currentUser.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Role / Position
            </label>
            {isEditing ? (
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 text-sm text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-sm font-semibold text-blue-700 border border-slate-100">
                {currentUser.role || 'Computer Science Engineering'}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            About / Bio
          </label>
          {isEditing ? (
            <textarea
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full bg-slate-50 text-sm text-slate-900 p-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
              placeholder="Tell collaborators about your focus area..."
            />
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-100 leading-relaxed">
              {currentUser.about || currentUser.bio || 'Collaborative document author on SyncDoc platform.'}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Presence & Remote Cursor Color:</span>
            <span
              className="w-4 h-4 rounded-full inline-block ring-2 ring-slate-200"
              style={{ backgroundColor: currentUser.color || '#3b82f6' }}
            />
          </div>
          <span>Status: <strong className="text-emerald-600">Active</strong></span>
        </div>
      </form>
    </div>
  );
};
