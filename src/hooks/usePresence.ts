import { useState, useEffect, useCallback } from 'react';
import { PresenceUser } from '../types/collaboration';
import { MOCK_PRESENCE_USERS } from '../services/websocket';

export interface UsePresenceReturn {
  activeUsers: PresenceUser[];
  currentUser: PresenceUser;
  updateLocalPresence: (updates: Partial<PresenceUser>) => void;
  getUserEditingBlock: (blockId: string) => PresenceUser | undefined;
}

const LOCAL_USER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'];
const RANDOM_COLOR = LOCAL_USER_COLORS[Math.floor(Math.random() * LOCAL_USER_COLORS.length)];

export const usePresence = (documentId: string): UsePresenceReturn => {
  const [currentUser, setCurrentUser] = useState<PresenceUser>({
    id: `usr-local-${Math.random().toString(36).substring(2, 7)}`,
    name: 'You (Author)',
    color: RANDOM_COLOR,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    currentBlockId: null,
    cursorOffset: null,
    lastActive: new Date().toISOString(),
  });

  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>(MOCK_PRESENCE_USERS);

  useEffect(() => {
    // Periodically update active timestamps for simulated peers to maintain active state
    const interval = setInterval(() => {
      setActiveUsers((prev) =>
        prev.map((user) => ({
          ...user,
          lastActive: new Date().toISOString(),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [documentId]);

  const updateLocalPresence = useCallback((updates: Partial<PresenceUser>) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updates,
      lastActive: new Date().toISOString(),
    }));
  }, []);

  const getUserEditingBlock = useCallback(
    (blockId: string): PresenceUser | undefined => {
      return activeUsers.find((user) => user.currentBlockId === blockId);
    },
    [activeUsers]
  );

  return {
    activeUsers,
    currentUser,
    updateLocalPresence,
    getUserEditingBlock,
  };
};
