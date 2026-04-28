import React, { useState } from 'react';
import { Bell, CheckCheck, Calendar, Wrench, MessageSquare, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const ICON_MAP = {
  BOOKING: { icon: <Calendar size={16} />, color: 'var(--primary)', bg: 'var(--primary-bg)' },
  TICKET:  { icon: <Wrench size={16} />,   color: 'var(--warning)', bg: 'var(--warning-bg)' },
  COMMENT: { icon: <MessageSquare size={16} />, color: 'var(--success)', bg: 'var(--success-bg)' },
  SYSTEM:  { icon: <Bell size={16} />,     color: 'var(--purple)',  bg: 'var(--purple-bg)' },
};

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'BOOKING', message: 'Your booking for Computer Lab A-101 on April 20 has been approved.', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, type: 'TICKET', message: 'Ticket #2 "AC unit leaking" has been updated to IN_PROGRESS.', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, type: 'COMMENT', message: 'Tech. Raj commented on your ticket: "Parts ordered."', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, type: 'BOOKING', message: 'Your booking for Lecture Hall C-201 on April 22 was rejected.', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 5, type: 'SYSTEM', message: 'Welcome to Smart Campus Hub! You can now book facilities and report incidents.', read: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

const NotificationsPage = () => {
  const ctx = useNotifications();
  const notifications = ctx?.notifications?.length > 0 ? ctx.notifications : MOCK_NOTIFICATIONS;
  const markRead = ctx?.markRead || (() => {});
  const markAllRead = ctx?.markAllRead || (() => {});
  const deleteNotification = ctx?.deleteNotification || (() => {});
  const deleteAllNotifications = ctx?.deleteAllNotifications || (() => {});
  const unreadCount = ctx?.unreadCount ?? MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const handleDeleteAll = () => {
    deleteAllNotifications();
    setConfirmDeleteAll(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Notifications</h2>
          <p>{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllRead}>
              <CheckCheck size={16} /> Mark all as read
            </button>
          )}
          {notifications.length > 0 && !confirmDeleteAll && (
            <button className="btn btn-danger" onClick={() => setConfirmDeleteAll(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={16} /> Clear all
            </button>
          )}
          {confirmDeleteAll && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Delete all notifications?</span>
              <button className="btn btn-danger" onClick={handleDeleteAll} style={{ padding: '6px 12px', fontSize: 13 }}>
                Yes, delete
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteAll(false)} style={{ padding: '6px 12px', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={28} /></div>
          <h3>No notifications</h3>
          <p>You're all caught up! Notifications about bookings, tickets, and comments will appear here.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notifications.map((n, idx) => {
            const style = ICON_MAP[n.type] || ICON_MAP.SYSTEM;
            return (
              <div key={n.id}
                style={{
                  display: 'flex', gap: 14, padding: '16px 20px',
                  borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                  background: !n.read ? 'var(--primary-bg)' : 'transparent',
                  transition: 'background 0.2s',
                  alignItems: 'flex-start'
                }}
              >
                {/* Type icon */}
                <div
                  onClick={() => markRead(n.id)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: style.bg, color: style.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: !n.read ? 'pointer' : 'default'
                  }}
                >
                  {style.icon}
                </div>

                {/* Message */}
                <div style={{ flex: 1, cursor: !n.read ? 'pointer' : 'default' }} onClick={() => !n.read && markRead(n.id)}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: !n.read ? 600 : 400 }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', marginTop: 6, flexShrink: 0 }} />
                )}

                {/* Delete button */}
                <button
                  onClick={() => deleteNotification(n.id)}
                  title="Delete notification"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '4px', borderRadius: 4,
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger, #ef4444)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
