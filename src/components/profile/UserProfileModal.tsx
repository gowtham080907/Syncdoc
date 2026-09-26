import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { EditorRole } from '../../types/user';
import { User, Check } from 'lucide-react';

export interface UserProfileModalProps {
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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<EditorRole>('Frontend Engineer');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setRole(currentUser.role);
      setAvatar(currentUser.avatar);
      setBio(currentUser.bio || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      role,
      avatar: avatar.trim(),
      bio: bio.trim(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editor Profile & Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xl ring-2 ring-brand-500 shrink-0"
            style={{ backgroundColor: currentUser.color }}
          >
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-100">{currentUser.name}</h4>
            <span className="text-xs font-medium text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
              {currentUser.role}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Display Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Role
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
            Avatar URL
          </label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<Check className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
