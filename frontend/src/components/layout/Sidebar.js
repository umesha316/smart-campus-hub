import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CalendarCheck, AlertTriangle,
  Bell, Users, Settings, LogOut, UserCircle, X, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/facilities', icon: <Building2 size={18} />, label: 'Facilities' },
    { to: '/bookings', icon: <CalendarCheck size={18} />, label: 'Bookings' },
    { to: '/tickets', icon: <AlertTriangle size={18} />, label: 'Incidents' },
    {
      to: '/notifications', icon: <Bell size={18} />, label: 'Notifications',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { to: '/profile', icon: <UserCircle size={18} />, label: 'My Profile' },
  ];

  const adminItems = [
    { to: '/admin/users', icon: <Users size={18} />, label: 'Users' },
    { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <GraduationCap size={22} />
        </div>
        <div className="sidebar-logo-text">
          <h2>SmartCampus</h2>
          <span>Operations Hub</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Admin</div>
            {adminItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}

        <div style={{ flex: 1 }} />
        <button className="nav-item" onClick={handleLogout} style={{ marginTop: 8 }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar" style={{ overflow: 'hidden' }}>
          {user?.picture
            ? <img src={user.picture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div className="user-info">
          <h4>{user?.name || 'User'}</h4>
          <span>{user?.email}</span>
        </div>
        <span className="user-role-badge" style={{
          background: user?.role === 'ADMIN' ? 'var(--danger-bg)' : user?.role === 'TECHNICIAN' ? 'var(--warning-bg, #fef3c7)' : 'var(--primary-bg)',
          color: user?.role === 'ADMIN' ? 'var(--danger)' : user?.role === 'TECHNICIAN' ? '#d97706' : 'var(--primary)',
          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700
        }}>{user?.role || 'USER'}</span>
      </div>
    </aside>
  );
};

export default Sidebar;
