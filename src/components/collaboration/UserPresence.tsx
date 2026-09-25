import React from 'react';
import { PresenceUser } from '../../types/collaboration';
import { X, UserCheck, Activity } from 'lucide-react';

export interface UserPresenceProps {
  activeUsers: PresenceUser[];
  currentUser: PresenceUser;
  onClose: () => void;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  activeUsers,
  currentUser,
  onClose,
}) => {
  const allUsers = [currentUser, ...activeUsers];

  return (
    <div className="absolute right-0 top-10 z-50 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Active Collaborators ({allUsers.length})
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
        {allUsers.map((user) => {
          const isSelf = user.id === currentUser.id;
          return (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
              <div className="relative shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-800 overflow-hidden"
                  style={{ backgroundColor: user.color }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {user.name} {isSelf && '(You)'}
                  </span>
                  {isSelf && <UserCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                </div>

                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {user.currentBlockId ? (
                    <span className="text-slate-300">
                      Editing block <code className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-brand-300">{user.currentBlockId}</code>
                    </span>
                  ) : (
                    'Viewing document'
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
