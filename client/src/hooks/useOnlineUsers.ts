import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { useOnlineStore } from "../store/onlineStore";
import { useAuthStore } from "../store/authStore";

export const useOnlineUsers = () => {
  const { on, off } = useSocket();
  const setUserOnline = useOnlineStore((state) => state.setUserOnline);
  const setOnlineUsers = useOnlineStore((state) => state.setOnlineUsers);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetch("http://localhost:4003/api/users/online")
      .then((res) => res.json())
      .then((data) => {
        const onlineMap: Record<string, boolean> = {};
        data.onlineUsers.forEach((userId: string) => {
          onlineMap[userId] = true;
        });
        setOnlineUsers(onlineMap);
      })
      .catch((error) => console.error("Failed to fetch online users:", error));

    const handleUserStatus = (data: { userId: string; isOnline: boolean }) => {
      setUserOnline(data.userId, data.isOnline);
    };

    on("user:status", handleUserStatus);

    return () => {
      off("user:status", handleUserStatus);
    };
  }, [isAuthenticated, on, off, setUserOnline, setOnlineUsers]);
};
