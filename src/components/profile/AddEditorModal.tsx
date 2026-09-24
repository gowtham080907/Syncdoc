import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { EditorRole } from '../../types/user';
import { UserPlus, Sparkles } from 'lucide-react';

export interface AddEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES: EditorRole[] = [
  'Lead Technical Writer',
  'Frontend Engineer',
  'AST Architect',
  'Backend Engineer',
  'Reviewer',
];

const ACCENT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e'];

export const AddEditorModal: React.FC<AddEditorModalProps> = ({ isOpen, onClose }) => {
  const { addEditor } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<EditorRole>('Frontend Engineer');
  const [color, setColor] = useState('#3b82f6');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addEditor({
      name: name.trim(),
      username: name.trim().toLowerCase().replace(/\s+/g, ''),
      email: email.trim(),
      role,
      color,
      avatar: avatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      bio: bio.trim() || 'Collaborative SyncDoc technical specification editor.',
    });

    setName('');
    setEmail('');
    setAvatar('');
    setBio('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Collaborative Editor">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-300">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Newly added editors can immediately log in and collaborate on documents in real-time.</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Smith"
              className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@syncdoc.io"
              className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Team Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as EditorRole)}
              className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Presence Accent Color
            </label>
            <div className="flex items-center gap-2 py-1">
              {ACCENT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-125 border-white ring-2 ring-brand-500' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Avatar Image URL (Optional)
          </label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<UserPlus className="w-4 h-4" />}>
            Create Editor Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
