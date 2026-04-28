import React, { useState, useEffect } from 'react';
import { Search, Users, Shield, Download, FileText, Trash2, Plus, X, UserPlus } from 'lucide-react';
import { userService } from '../services';
import toast from 'react-hot-toast';

const ROLES = ['USER', 'TECHNICIAN', 'ADMIN'];
const ROLE_BADGE = { ADMIN: 'badge-red', TECHNICIAN: 'badge-purple', USER: 'badge-blue' };

/* ─── Create User Modal ───────────────────────────────────────── */
const CreateUserModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'USER', phone: '', department: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setSaving(true);
    try {
      const result = await userService.createUser(form);
      toast.success('User created successfully');
      onSave(result || { ...form, id: Date.now(), provider: 'LOCAL', createdAt: new Date().toISOString() });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create user';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Create New User</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input className="form-control" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input type="email" className="form-control" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <input type="password" className="form-control" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters" required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+94 71 000 0000" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Engineering" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner spinner-sm" /> : <><UserPlus size={15} /> Create User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────── */
const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportLoading, setExportLoading] = useState({ csv: false, pdf: false });

  useEffect(() => {
    userService.getAll()
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateRole(userId, newRole);
      toast.success('Role updated successfully');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleCreateSave = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
    setShowCreateModal(false);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    setExportLoading(p => ({ ...p, csv: true }));
    try {
      const blob = await userService.exportCsv();
      downloadBlob(blob, 'users_report.csv');
      toast.success('CSV downloaded!');
    } catch {
      toast.error('CSV export failed');
    } finally { setExportLoading(p => ({ ...p, csv: false })); }
  };

  const handleExportPdf = async () => {
    setExportLoading(p => ({ ...p, pdf: true }));
    try {
      const blob = await userService.exportPdf();
      downloadBlob(blob, 'users_report.pdf');
      toast.success('PDF downloaded!');
    } catch {
      toast.error('PDF export failed');
    } finally { setExportLoading(p => ({ ...p, pdf: false })); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div className="page-header-left">
          <h2>User Management</h2>
          <p>Create, manage roles, and control user access</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Stats */}
          {['USER', 'TECHNICIAN', 'ADMIN'].map(role => (
            <div key={role} style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', minWidth: 72 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{users.filter(u => u.role === role).length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{role}S</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Buttons */}
      <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-input-wrapper">
          <Search size={16} />
          <input className="search-input" placeholder="Search by name, email or department..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 'auto' }}>{filtered.length} users</span>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> Add User
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleExportCsv}
          disabled={exportLoading.csv}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          {exportLoading.csv ? <span className="spinner spinner-sm" /> : <Download size={14} />}
          Export CSV
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleExportPdf}
          disabled={exportLoading.pdf}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--danger)', borderColor: 'var(--danger)' }}
        >
          {exportLoading.pdf ? <span className="spinner spinner-sm" /> : <FileText size={14} />}
          Export PDF
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-screen" style={{ height: '30vh' }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={28} /></div>
              <h3>No users found</h3>
              <p>Try adjusting filters or create a new user.</p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={15} /> Add User
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Provider</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Change Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {u.picture && u.picture.startsWith('data:')
                            ? <img src={u.picture} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{u.name?.charAt(0) || 'U'}</span>}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.email}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.department || '—'}</td>
                    <td>
                      <span className={`badge ${u.provider === 'GOOGLE' ? 'badge-blue' : 'badge-gray'}`}>
                        {u.provider === 'GOOGLE' ? '🔵 Google' : '🔑 Local'}
                      </span>
                    </td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}><Shield size={10} /> {u.role}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <select className="filter-select" value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={{ fontSize: 13, padding: '5px 10px' }}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(u.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                        title="Delete user"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSave}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
