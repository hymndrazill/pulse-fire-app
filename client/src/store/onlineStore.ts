import { create } from "zustand";

interface OnlineState {
  onlineUsers: Record<string, boolean>;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setOnlineUsers: (users: Record<string, boolean>) => void;
}

export const useOnlineStore = create<OnlineState>((set) => ({
  onlineUsers: {},
  setUserOnline: (userId: string, isOnline: boolean) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: isOnline,
      },
    })),
  setOnlineUsers: (users: Record<string, boolean>) =>
    set({ onlineUsers: users }),
}));
