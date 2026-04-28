import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => {
        const removed = prev.find(n => n.id === id);
        const updated = prev.filter(n => n.id !== id);
        if (removed && !removed.read) setUnreadCount(c => Math.max(0, c - 1));
        return updated;
      });
    } catch (err) { console.error(err); }
  };

  const deleteAllNotifications = async () => {
    try {
      await notificationService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      markRead, markAllRead,
      deleteNotification, deleteAllNotifications,
      fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
