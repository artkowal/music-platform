/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSocket } from "@/context/SocketContext";
import { notificationsApi } from "@/api/notifications";
import { useAuth } from "@/hooks/useAuth";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message';
  timestamp: string | Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  latestNotification: NotificationItem | null;
  clearLatest: () => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Pobierz historię z bazy po zalogowaniu
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      notificationsApi.getAll()
        .then(data => {
            const parsed = data.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
            setNotifications(parsed);
        })
        .catch(err => console.error("Błąd pobierania powiadomień", err))
        .finally(() => setIsLoading(false));
    } else {
        setNotifications([]);
    }
  }, [user]);

  const playSound = () => {
    try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch(e) { console.error(e); }
  };

  // 2. Obsługa nowych powiadomień w czasie rzeczywistym
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (newItem: NotificationItem) => {
      playSound();
      
      newItem.timestamp = new Date(); 
      
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

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
        await notificationsApi.markAsRead(id);
    } catch(e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
        await notificationsApi.markAllAsRead();
    } catch(e) { console.error(e); }
  };

  const clearLatest = () => setLatestNotification(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, latestNotification, clearLatest, isLoading }}>
      {children}
    </NotificationContext.Provider>
  );
};