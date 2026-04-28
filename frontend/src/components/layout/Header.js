import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, CheckCheck, Menu, X, Sun, Moon } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { formatDistanceToNow } from 'date-fns';

const PAGE_TITLES = {
  '/dashboard': ['Dashboard', 'Welcome back!'],
  '/facilities': ['Facilities & Assets', 'Manage resources'],
  '/bookings': ['Bookings', 'Manage reservations'],
  '/tickets': ['Incident Tickets', 'Track & resolve issues'],
  '/notifications': ['Notifications', 'Stay updated'],
  '/admin/users': ['User Management', 'Manage roles & access'],
  '/admin/settings': ['Settings', 'Configure the system'],
  '/profile': ['My Profile', 'Manage your account'],
};

const Header = ({ onMenuToggle, sidebarOpen }) => {
  const location = useLocation();
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [showNotifs, setShowNotifs] = useState(false);
  const panelRef = useRef(null);

  const [title, subtitle] = PAGE_TITLES[location.pathname] || ['Smart Campus', 'Operations Hub'];

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getNotifIcon = (type) => {
    const icons = { BOOKING: '📅', TICKET: '🔧', COMMENT: '💬', SYSTEM: '🔔' };
    return icons[type] || '🔔';
  };

  const getNotifColor = (type) => {
    const colors = { BOOKING: '#3b82f6', TICKET: '#f59e0b', COMMENT: '#10b981', SYSTEM: '#8b5cf6' };
    return colors[type] || '#6b7280';
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-btn hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="header-left-text">
          <h1>{title}</h1>
          <span className="header-breadcrumb">{subtitle}</span>
        </div>
      </div>
      <div className="header-right">
        <button
          className="header-btn theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={{ position: 'relative' }} ref={panelRef}>
          <button
            className="header-btn"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {showNotifs && (
            <div className="notification-panel">
              <div className="notification-header">
                <h4>Notifications {unreadCount > 0 && <span className="nav-badge" style={{ marginLeft: 6 }}>{unreadCount}</span>}</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div
                      key={n.id}
                      className={`notification-item ${!n.read ? 'unread' : ''}`}
                      style={{ position: 'relative' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}
                           onClick={() => markRead(n.id)}>
                        <div className="notification-icon" style={{ background: getNotifColor(n.type) + '20' }}>
                          <span>{getNotifIcon(n.type)}</span>
                        </div>
                        <div className="notification-content">
                          <p>{n.message}</p>
                          <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                        </div>
                        {!n.read && (
                          <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        title="Delete"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', padding: '2px 4px',
                          borderRadius: 4, flexShrink: 0, lineHeight: 1
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
