import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, CalendarCheck, AlertTriangle, Clock,
  CheckCircle, TrendingUp, ArrowRight, Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { facilityService, bookingService, ticketService } from '../services';

const DashboardPage = () => {
  const { user, isAdmin, isTechnician } = useAuth();
  const [stats, setStats] = useState({
    facilities: 0, bookings: 0, tickets: 0,
    pendingBookings: 0, openTickets: 0, resolvedTickets: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [facilities, bookings, tickets] = await Promise.allSettled([
          facilityService.getAll(),
          isAdmin() ? bookingService.getAll() : bookingService.getMyBookings(),
          isAdmin() || isTechnician() ? ticketService.getAll() : ticketService.getMyTickets(),
        ]);

        const f = facilities.status === 'fulfilled' ? facilities.value : { content: [], totalElements: 0 };
        const b = bookings.status === 'fulfilled' ? bookings.value : { content: [], totalElements: 0 };
        const t = tickets.status === 'fulfilled' ? tickets.value : { content: [], totalElements: 0 };

        const bList = Array.isArray(b) ? b : (b.content || []);
        const tList = Array.isArray(t) ? t : (t.content || []);
        const fList = Array.isArray(f) ? f : (f.content || []);

        setStats({
          facilities: fList.length,
          bookings: bList.length,
          tickets: tList.length,
          pendingBookings: bList.filter(x => x.status === 'PENDING').length,
          openTickets: tList.filter(x => x.status === 'OPEN' || x.status === 'IN_PROGRESS').length,
          resolvedTickets: tList.filter(x => x.status === 'RESOLVED' || x.status === 'CLOSED').length,
        });
        setRecentBookings(bList.slice(0, 5));
        setRecentTickets(tList.slice(0, 5));
      } catch (err) {
        console.error(err);
        setStats({ facilities: 0, bookings: 0, tickets: 0, pendingBookings: 0, openTickets: 0, resolvedTickets: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusBadge = (status) => {
    const map = {
      PENDING: 'badge-amber', APPROVED: 'badge-green', REJECTED: 'badge-red',
      CANCELLED: 'badge-gray', OPEN: 'badge-red', IN_PROGRESS: 'badge-amber',
      RESOLVED: 'badge-green', CLOSED: 'badge-gray', ACTIVE: 'badge-green',
      OUT_OF_SERVICE: 'badge-red'
    };
    return map[status] || 'badge-gray';
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ height: '60vh' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading dashboard...</p>
      </div>
    );
  }

  const roleLabel = isAdmin() ? '🔑 Admin' : isTechnician() ? '🔧 Technician' : '👤 User';

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 28,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -60, width: 150, height: 150, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h2>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            {roleLabel}
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          Here's what's happening in your campus today.
        </p>
        {isAdmin() && stats.pendingBookings > 0 && (
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600 }}>
            <Clock size={14} />
            {stats.pendingBookings} booking{stats.pendingBookings > 1 ? 's' : ''} awaiting approval
            <Link to="/bookings" style={{ color: 'white', textDecoration: 'underline' }}>Review →</Link>
          </div>
        )}
        {isTechnician() && !isAdmin() && stats.openTickets > 0 && (
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600 }}>
            <Wrench size={14} />
            {stats.openTickets} open ticket{stats.openTickets > 1 ? 's' : ''} to handle
            <Link to="/tickets" style={{ color: 'white', textDecoration: 'underline' }}>View →</Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Building2 size={22} /></div>
          <div className="stat-info">
            <h3>{stats.facilities}</h3>
            <p>Total Facilities</p>
            <span className="stat-change up">↑ Active resources</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CalendarCheck size={22} /></div>
          <div className="stat-info">
            <h3>{stats.bookings}</h3>
            <p>{isAdmin() ? 'All Bookings' : 'My Bookings'}</p>
            {stats.pendingBookings > 0 && <span className="stat-change down">{stats.pendingBookings} pending</span>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><AlertTriangle size={22} /></div>
          <div className="stat-info">
            <h3>{stats.openTickets}</h3>
            <p>Open Incidents</p>
            <span className="stat-change down">Needs attention</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={22} /></div>
          <div className="stat-info">
            <h3>{stats.resolvedTickets}</h3>
            <p>Resolved Tickets</p>
            <span className="stat-change up">↑ Good progress</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <Link to="/bookings" className="btn btn-secondary btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-wrapper">
            {recentBookings.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <p style={{ fontSize: 13 }}>No bookings yet</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b, i) => (
                    <tr key={b.id || i}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.facilityName || b.resource || 'N/A'}</td>
                      <td>{b.bookingDate || b.date || '—'}</td>
                      <td><span className={`badge ${statusBadge(b.status)}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Incidents</h3>
            <Link to="/tickets" className="btn btn-secondary btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-wrapper">
            {recentTickets.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <p style={{ fontSize: 13 }}>No tickets yet</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((t, i) => (
                    <tr key={t.id || i}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 160 }} className="truncate">{t.title || 'Incident'}</td>
                      <td>
                        <span className={`badge ${t.priority === 'HIGH' || t.priority === 'CRITICAL' ? 'badge-red' : t.priority === 'MEDIUM' ? 'badge-amber' : 'badge-green'}`}>
                          {t.priority || 'LOW'}
                        </span>
                      </td>
                      <td><span className={`badge ${statusBadge(t.status)}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
