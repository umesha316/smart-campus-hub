import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Building2, Users, MapPin, Clock, Edit, Trash2, X, Download, FileText, FileSpreadsheet, BarChart2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { facilityService } from '../services';
import toast from 'react-hot-toast';

const TYPES = ['ALL', 'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const STATUSES = ['ALL', 'ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];
const TYPE_ICONS = { LECTURE_HALL: '🏛️', LAB: '🔬', MEETING_ROOM: '🤝', EQUIPMENT: '📽️' };
const TYPE_LABELS = { LECTURE_HALL: 'Lecture Hall', LAB: 'Lab', MEETING_ROOM: 'Meeting Room', EQUIPMENT: 'Equipment' };

/* ─── CSV Export ─────────────────────────────────────────────── */
const exportCSV = (facilities) => {
  const headers = ['ID', 'Name', 'Type', 'Status', 'Capacity', 'Location', 'Availability'];
  const rows = facilities.map(f => [
    f.id,
    `"${(f.name || '').replace(/"/g, '""')}"`,
    TYPE_LABELS[f.type] || f.type || '',
    (f.status || '').replace(/_/g, ' '),
    f.capacity || '',
    `"${(f.location || '').replace(/"/g, '""')}"`,
    `"${(f.availabilityWindows || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facilities-report-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV exported successfully!');
};

/* ─── PDF Export (browser print) ────────────────────────────── */
const exportPDF = (facilities, filters) => {
  const now = new Date().toLocaleString();
  const statusCount = { ACTIVE: 0, OUT_OF_SERVICE: 0, UNDER_MAINTENANCE: 0 };
  facilities.forEach(f => { if (statusCount[f.status] !== undefined) statusCount[f.status]++; });
  const typeCount = {};
  facilities.forEach(f => { typeCount[f.type] = (typeCount[f.type] || 0) + 1; });

  const rows = facilities.map(f => `
    <tr>
      <td>${f.id}</td>
      <td><strong>${f.name || '-'}</strong></td>
      <td>${TYPE_LABELS[f.type] || f.type || '-'}</td>
      <td><span class="badge badge-${f.status === 'ACTIVE' ? 'green' : f.status === 'OUT_OF_SERVICE' ? 'red' : 'amber'}">${(f.status || '-').replace(/_/g, ' ')}</span></td>
      <td style="text-align:center">${f.capacity || '-'}</td>
      <td>${f.location || '-'}</td>
      <td>${f.availabilityWindows || '-'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Facilities Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #6366f1; }
    .header h1 { font-size: 22px; color: #6366f1; font-weight: 700; }
    .header p { font-size: 11px; color: #64748b; margin-top: 4px; }
    .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.8; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
    .stat-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
    .stat-card .value { font-size: 22px; font-weight: 700; color: #1e293b; }
    .stat-card .sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .section-title { font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead { background: #6366f1; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #f1f5f9; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-amber { background: #fef3c7; color: #d97706; }
    .type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 28px; }
    .type-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; }
    .type-item .name { font-size: 12px; color: #475569; }
    .type-item .count { font-size: 16px; font-weight: 700; color: #6366f1; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🏛️ SmartCampus — Facilities Report</h1>
      <p>Comprehensive overview of all campus facilities and assets</p>
      ${filters ? `<p style="margin-top:6px;color:#6366f1">Filter: ${filters}</p>` : ''}
    </div>
    <div class="meta">
      <div>Generated: ${now}</div>
      <div>Total Records: ${facilities.length}</div>
    </div>
  </div>

  <div class="summary">
    <div class="stat-card">
      <div class="label">Total Facilities</div>
      <div class="value">${facilities.length}</div>
      <div class="sub">All assets</div>
    </div>
    <div class="stat-card">
      <div class="label">Active</div>
      <div class="value" style="color:#16a34a">${statusCount.ACTIVE}</div>
      <div class="sub">Operational</div>
    </div>
    <div class="stat-card">
      <div class="label">Under Maintenance</div>
      <div class="value" style="color:#d97706">${statusCount.UNDER_MAINTENANCE}</div>
      <div class="sub">Being serviced</div>
    </div>
    <div class="stat-card">
      <div class="label">Out of Service</div>
      <div class="value" style="color:#dc2626">${statusCount.OUT_OF_SERVICE}</div>
      <div class="sub">Unavailable</div>
    </div>
  </div>

  <div class="section-title">By Facility Type</div>
  <div class="type-grid">
    ${Object.entries(typeCount).map(([type, count]) => `
      <div class="type-item">
        <span class="name">${TYPE_LABELS[type] || type}</span>
        <span class="count">${count}</span>
      </div>`).join('')}
  </div>

  <div class="section-title">Facility Details</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Name</th><th>Type</th><th>Status</th><th>Capacity</th><th>Location</th><th>Availability</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">SmartCampus Operations Hub &mdash; Confidential &mdash; Generated ${now}</div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
};

/* ─── Report Dropdown Button ─────────────────────────────────── */
const ReportButton = ({ onCSV, onPDF }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="btn btn-secondary"
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Download size={15} /> Export Report <ChevronDown size={13} style={{ marginLeft: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: 'var(--shadow-md)', minWidth: 180, zIndex: 50, overflow: 'hidden'
        }}>
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <FileSpreadsheet size={15} style={{ color: '#16a34a' }} /> Export as CSV
          </button>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <button
            onClick={() => { onPDF(); setOpen(false); }}
            style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <FileText size={15} style={{ color: '#dc2626' }} /> Export as PDF
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Facility Form Modal ────────────────────────────────────── */
const FacilityFormModal = ({ facility, onClose, onSave }) => {
  const [form, setForm] = useState(facility || {
    name: '', type: 'LAB', capacity: '', location: '',
    availabilityWindows: '8AM - 6PM', status: 'ACTIVE', description: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let result;
      if (facility?.id) {
        result = await facilityService.update(facility.id, form);
      } else {
        result = await facilityService.create(form);
      }
      toast.success(`Facility ${facility?.id ? 'updated' : 'created'} successfully`);
      onSave(result || { ...form, id: Date.now() });
    } catch {
      onSave({ ...form, id: facility?.id || Date.now() });
      toast.success(`Facility ${facility?.id ? 'updated' : 'created'} (demo mode)`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{facility?.id ? 'Edit Facility' : 'Add New Facility'}</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Facility Name <span className="required">*</span></label>
                <input className="form-control" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Computer Lab A-101" />
              </div>
              <div className="form-group">
                <label className="form-label">Type <span className="required">*</span></label>
                <select className="form-control" value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.filter(t => t !== 'ALL').map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input type="number" className="form-control" value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="0" min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.filter(s => s !== 'ALL').map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-control" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Block A, Floor 1" />
            </div>
            <div className="form-group">
              <label className="form-label">Availability Window</label>
              <input className="form-control" value={form.availabilityWindows}
                onChange={e => setForm({ ...form, availabilityWindows: e.target.value })} placeholder="e.g. 8AM - 6PM" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the facility..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner spinner-sm" /> : (facility?.id ? 'Update Facility' : 'Create Facility')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────── */
const FacilitiesPage = () => {
  const { isAdmin } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editFacility, setEditFacility] = useState(null);

  const loadFacilities = useCallback(async () => {
    try {
      const data = await facilityService.getAll({ type: typeFilter !== 'ALL' ? typeFilter : undefined });
      const list = Array.isArray(data) ? data : (data.content || []);
      setFacilities(list);
    } catch {
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { loadFacilities(); }, [loadFacilities]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this facility?')) return;
    try {
      await facilityService.delete(id);
      toast.success('Facility deleted');
    } catch { toast.success('Deleted (demo mode)'); }
    setFacilities(prev => prev.filter(f => f.id !== id));
  };

  const handleSave = (saved) => {
    setFacilities(prev => {
      const exists = prev.find(f => f.id === saved.id);
      return exists ? prev.map(f => f.id === saved.id ? saved : f) : [saved, ...prev];
    });
    setShowModal(false);
    setEditFacility(null);
  };

  const filtered = facilities.filter(f => {
    const matchSearch = !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchType = typeFilter === 'ALL' || f.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const statusBadgeClass = (s) => ({
    ACTIVE: 'badge-green', OUT_OF_SERVICE: 'badge-red', UNDER_MAINTENANCE: 'badge-amber'
  }[s] || 'badge-gray');

  const filterLabel = [
    typeFilter !== 'ALL' ? `Type: ${TYPE_LABELS[typeFilter]}` : '',
    statusFilter !== 'ALL' ? `Status: ${statusFilter.replace(/_/g, ' ')}` : '',
    search ? `Search: "${search}"` : '',
  ].filter(Boolean).join(' | ') || 'All Facilities';

  /* Summary stats */
  const activeCount = facilities.filter(f => f.status === 'ACTIVE').length;
  const maintCount = facilities.filter(f => f.status === 'UNDER_MAINTENANCE').length;
  const oosCount = facilities.filter(f => f.status === 'OUT_OF_SERVICE').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Facilities & Assets</h2>
          <p>Manage bookable resources — rooms, labs, and equipment</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isAdmin() && (
            <ReportButton
              onCSV={() => exportCSV(filtered)}
              onPDF={() => exportPDF(filtered, filterLabel)}
            />
          )}
          {isAdmin() && (
            <button className="btn btn-primary" onClick={() => { setEditFacility(null); setShowModal(true); }}>
              <Plus size={16} /> Add Facility
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats Bar — Admin only */}
      {isAdmin() && !loading && facilities.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total', value: facilities.length, color: 'var(--primary)', icon: <BarChart2 size={16} /> },
            { label: 'Active', value: activeCount, color: '#16a34a', icon: '✅' },
            { label: 'Maintenance', value: maintCount, color: '#d97706', icon: '🔧' },
            { label: 'Out of Service', value: oosCount, color: '#dc2626', icon: '❌' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input className="search-input" placeholder="Search by name or location..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : TYPE_LABELS[t]}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} results</span>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ height: '40vh' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Building2 size={28} /></div>
          <h3>No facilities found</h3>
          <p>Try adjusting your filters or add a new facility.</p>
          {isAdmin() && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Facility</button>}
        </div>
      ) : (
        <div className="resource-grid">
          {filtered.map(facility => (
            <div key={facility.id} className="resource-card">
              <div className="resource-card-img">
                <span style={{ fontSize: 52 }}>{TYPE_ICONS[facility.type] || '🏢'}</span>
              </div>
              <div className="resource-card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h4 style={{ fontSize: 15 }}>{facility.name}</h4>
                  <span className={`badge ${statusBadgeClass(facility.status)}`}>{facility.status?.replace(/_/g, ' ')}</span>
                </div>
                <div className="resource-meta">
                  {facility.capacity && (
                    <div className="resource-meta-item">
                      <Users size={13} /> {facility.capacity} seats
                    </div>
                  )}
                  {facility.location && (
                    <div className="resource-meta-item">
                      <MapPin size={13} /> {facility.location}
                    </div>
                  )}
                  {facility.availabilityWindows && (
                    <div className="resource-meta-item">
                      <Clock size={13} /> {facility.availabilityWindows}
                    </div>
                  )}
                </div>
                <span className={`badge ${facility.type === 'LAB' ? 'badge-blue' : facility.type === 'EQUIPMENT' ? 'badge-purple' : 'badge-gray'}`}>
                  {TYPE_LABELS[facility.type] || facility.type}
                </span>
              </div>
              <div className="resource-card-footer">
                {isAdmin() ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => { setEditFacility(facility); setShowModal(true); }}>
                      <Edit size={13} /> Edit
                    </button>
                    <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                      onClick={() => handleDelete(facility.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>View only</span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{facility.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <FacilityFormModal
          facility={editFacility}
          onClose={() => { setShowModal(false); setEditFacility(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default FacilitiesPage;
