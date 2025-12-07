/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSocket } from "@/context/SocketContext";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message';
  timestamp: Date;
  read: boolean;
}

interface SocketNotificationPayload {
  title: string;
  description: string;
  link?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'message';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  latestNotification: NotificationItem | null;
  clearLatest: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);

  const playSound = () => {
    try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: SocketNotificationPayload) => {
      playSound();
      
      const newItem: NotificationItem = {
        id: Math.random().toString(36).substring(2, 9),
        title: data.title,
        description: data.description,
        link: data.link,
        type: data.type || 'info',
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [newItem, ...prev]);
      setLatestNotification(newItem);

      setTimeout(() => {
        setLatestNotification(prev => (prev?.id === newItem.id ? null : prev));
      }, 5000);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearLatest = () => setLatestNotification(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, latestNotification, clearLatest }}>
      {children}
    </NotificationContext.Provider>
  );
};