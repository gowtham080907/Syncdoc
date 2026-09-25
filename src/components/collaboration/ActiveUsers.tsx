import React, { useState } from 'react';
import { PresenceUser } from '../../types/collaboration';
import { UserPresence } from './UserPresence';

export interface ActiveUsersProps {
  activeUsers: PresenceUser[];
  currentUser: PresenceUser;
}

export const ActiveUsers: React.FC<ActiveUsersProps> = ({ activeUsers, currentUser }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const totalUsers = [currentUser, ...activeUsers];

  return (
    <div className="relative">
      <button
        onClick={() => setIsDrawerOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 px-2.5 py-1 rounded-full text-xs font-medium text-slate-200 transition-all cursor-pointer"
        title="View active collaborative users"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <div className="flex -space-x-1.5 overflow-hidden">
          {totalUsers.slice(0, 4).map((user, idx) => (
            <div
              key={user.id || idx}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 overflow-hidden bg-slate-700 text-white font-semibold text-[10px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: user.color }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
          ))}
        </div>
        <span className="font-semibold text-slate-200">{totalUsers.length} Online</span>
      </button>

      {isDrawerOpen && (
        <UserPresence
          activeUsers={activeUsers}
          currentUser={currentUser}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
};
