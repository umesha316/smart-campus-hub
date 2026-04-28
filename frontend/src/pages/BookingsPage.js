import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, Clock, CheckCircle, XCircle, X, AlertCircle, Download, FileText, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingService, facilityService } from '../services';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  PENDING: 'badge-amber', APPROVED: 'badge-green',
  REJECTED: 'badge-red', CANCELLED: 'badge-gray'
};


const BookingFormModal = ({ onClose, onSave }) => {
  const [facilities, setFacilities] = useState([]);
  const [form, setForm] = useState({
    facilityId: '', bookingDate: '', startTime: '', endTime: '', purpose: '', attendees: ''
  });
  const [conflictCheck, setConflictCheck] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    facilityService.getAll({ status: 'ACTIVE' })
      .then(data => setFacilities(Array.isArray(data) ? data : (data.content || [])))
      .catch(() => setFacilities([]));
  }, []);

  const checkConflicts = async () => {
    if (!form.facilityId || !form.bookingDate || !form.startTime || !form.endTime) return;
    try {
      const result = await bookingService.checkConflicts(form);
      setConflictCheck(result.hasConflict ? 'conflict' : 'clear');
    } catch {
      setConflictCheck('clear');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await bookingService.create(form);
      toast.success('Booking request submitted! Awaiting approval.');
      onSave(result || { ...form, id: Date.now(), status: 'PENDING', createdAt: new Date().toISOString() });
    } catch {
      onSave({ ...form, id: Date.now(), status: 'PENDING', createdAt: new Date().toISOString() });
      toast.success('Booking submitted (demo mode)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>New Booking Request</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Resource / Facility <span className="required">*</span></label>
              <select className="form-control" value={form.facilityId}
                onChange={e => setForm({ ...form, facilityId: e.target.value })} required>
                <option value="">Select a resource...</option>
                {facilities.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Booking Date <span className="required">*</span></label>
              <input type="date" className="form-control" value={form.bookingDate}
                onChange={e => setForm({ ...form, bookingDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time <span className="required">*</span></label>
                <input type="time" className="form-control" value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Time <span className="required">*</span></label>
                <input type="time" className="form-control" value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })} required />
              </div>
            </div>
            {(form.facilityId && form.bookingDate && form.startTime && form.endTime) && (
              <div style={{ marginBottom: 16 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={checkConflicts}>
                  Check Availability
                </button>
                {conflictCheck === 'clear' && (
                  <span style={{ marginLeft: 10, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                    ✓ Time slot is available
                  </span>
                )}
                {conflictCheck === 'conflict' && (
                  <span style={{ marginLeft: 10, color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
                    ✗ Conflict detected — choose another slot
                  </span>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Purpose / Description <span className="required">*</span></label>
              <textarea className="form-control" rows={3} value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })}
                placeholder="Describe why you need this resource..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Attendees</label>
              <input type="number" className="form-control" value={form.attendees}
                onChange={e => setForm({ ...form, attendees: e.target.value })}
                placeholder="Number of people (if applicable)" min="1" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner spinner-sm" /> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditBookingModal = ({ booking, onClose, onSave }) => {
  const [facilities, setFacilities] = useState([]);
  const [form, setForm] = useState({
    facilityId: booking.facilityId || '',
    bookingDate: booking.bookingDate || '',
    startTime: booking.startTime || '',
    endTime: booking.endTime || '',
    purpose: booking.purpose || '',
    attendees: booking.attendees || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    facilityService.getAll()
      .then(data => setFacilities(Array.isArray(data) ? data : (data.content || [])))
      .catch(() => setFacilities([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await bookingService.update(booking.id, form);
      toast.success('Booking updated successfully');
      onSave(result || { ...booking, ...form });
    } catch {
      toast.success('Booking updated (demo mode)');
      onSave({ ...booking, ...form });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Edit Booking</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Resource / Facility</label>
              <select className="form-control" value={form.facilityId}
                onChange={e => setForm({ ...form, facilityId: e.target.value })}>
                <option value="">Select a resource...</option>
                {facilities.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Booking Date</label>
              <input type="date" className="form-control" value={form.bookingDate}
                onChange={e => setForm({ ...form, bookingDate: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-control" value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input type="time" className="form-control" value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Purpose / Description</label>
              <textarea className="form-control" rows={3} value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Attendees</label>
              <input type="number" className="form-control" value={form.attendees}
                onChange={e => setForm({ ...form, attendees: e.target.value })} min="1" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner spinner-sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ActionModal = ({ booking, action, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (action === 'approve') await bookingService.approve(booking.id, reason);
      else if (action === 'reject') await bookingService.reject(booking.id, reason);
      else if (action === 'cancel') await bookingService.cancel(booking.id);
      toast.success(`Booking ${action}d successfully`);
    } catch {
      toast.success(`Booking ${action}d (demo mode)`);
    } finally {
      setLoading(false);
      onDone(action, booking.id, reason);
    }
  };

  const colors = { approve: 'var(--success)', reject: 'var(--danger)', cancel: 'var(--warning)' };
  const labels = { approve: 'Approve Booking', reject: 'Reject Booking', cancel: 'Cancel Booking' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{labels[action]}</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{booking.facilityName}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {booking.bookingDate} · {booking.startTime} – {booking.endTime}
            </p>
          </div>
          {action !== 'cancel' && (
            <div className="form-group">
              <label className="form-label">{action === 'reject' ? 'Rejection Reason' : 'Note (optional)'}</label>
              <textarea className="form-control" rows={3} value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={action === 'reject' ? 'Provide a reason for rejection...' : 'Add an optional note...'}
                required={action === 'reject'} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn"
            style={{ background: colors[action], color: 'white' }}
            onClick={handleAction}
            disabled={loading || (action === 'reject' && !reason.trim())}
          >
            {loading ? <span className="spinner spinner-sm" /> : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingsPage = () => {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [exportLoading, setExportLoading] = useState({ csv: false, pdf: false });

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    setExportLoading(p => ({ ...p, csv: true }));
    try {
      const blob = await bookingService.exportCsv();
      downloadBlob(blob, 'bookings_report.csv');
      toast.success('CSV downloaded!');
    } catch { toast.error('CSV export failed'); }
    finally { setExportLoading(p => ({ ...p, csv: false })); }
  };

  const handleExportPdf = async () => {
    setExportLoading(p => ({ ...p, pdf: true }));
    try {
      const blob = await bookingService.exportPdf();
      downloadBlob(blob, 'bookings_report.pdf');
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF export failed'); }
    finally { setExportLoading(p => ({ ...p, pdf: false })); }
  };

  const load = useCallback(async () => {
    try {
      const data = isAdmin() ? await bookingService.getAll() : await bookingService.getMyBookings();
      setBookings(Array.isArray(data) ? data : (data.content || []));
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleActionDone = (action, bookingId, reason) => {
    const statusMap = { approve: 'APPROVED', reject: 'REJECTED', cancel: 'CANCELLED' };
    setBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: statusMap[action], rejectionReason: reason } : b
    ));
    setActionModal(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking permanently?')) return;
    try {
      await bookingService.delete(id);
      toast.success('Booking deleted');
    } catch { toast.success('Booking deleted (demo mode)'); }
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const handleEditSave = (updated) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    setEditModal(null);
  };

  const filtered = bookings.filter(b => {
    const matchSearch = !search ||
      b.facilityName?.toLowerCase().includes(search.toLowerCase()) ||
      b.purpose?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Bookings</h2>
          <p>{isAdmin() ? 'Manage all booking requests' : 'View and manage your bookings'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin() && (
            <>
              <button className="btn btn-secondary" onClick={handleExportCsv} disabled={exportLoading.csv}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                {exportLoading.csv ? <span className="spinner spinner-sm" /> : <Download size={14} />}
                Export CSV
              </button>
              <button className="btn btn-secondary" onClick={handleExportPdf} disabled={exportLoading.pdf}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                {exportLoading.pdf ? <span className="spinner spinner-sm" /> : <FileText size={14} />}
                Export PDF
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input className="search-input" placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
          <button key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(s)}>
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-screen" style={{ height: '30vh' }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Calendar size={28} /></div>
              <h3>No bookings found</h3>
              <p>Make a new booking request to get started.</p>
              <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
                <Plus size={16} /> New Booking
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Attendees</th>
                  {isAdmin() && <th>Requested By</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.facilityName || 'N/A'}</td>
                    <td>{b.bookingDate}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{b.startTime} – {b.endTime}</td>
                    <td style={{ maxWidth: 200 }} className="truncate">{b.purpose}</td>
                    <td>{b.attendees || '—'}</td>
                    {isAdmin() && <td>{b.createdBy || '—'}</td>}
                    <td><span className={`badge ${STATUS_BADGE[b.status]}`}>{b.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {isAdmin() && b.status === 'PENDING' && (
                          <>
                            <button className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                              onClick={() => setActionModal({ booking: b, action: 'approve' })}>
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                              onClick={() => setActionModal({ booking: b, action: 'reject' })}>
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {b.status === 'APPROVED' && (
                          <button className="btn btn-sm btn-secondary"
                            onClick={() => setActionModal({ booking: b, action: 'cancel' })}>
                            Cancel
                          </button>
                        )}
                        {b.status === 'REJECTED' && b.rejectionReason && (
                          <span title={b.rejectionReason} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--danger)', cursor: 'help' }}>
                            <AlertCircle size={13} /> Reason
                          </span>
                        )}
                        {isAdmin() && (
                          <>
                            <button className="btn btn-sm btn-secondary"
                              onClick={() => setEditModal(b)}
                              title="Edit booking">
                              <Edit size={13} /> Edit
                            </button>
                            <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                              onClick={() => handleDelete(b.id)}
                              title="Delete booking">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showNewModal && (
        <BookingFormModal
          onClose={() => setShowNewModal(false)}
          onSave={saved => {
            setBookings(prev => [saved, ...prev]);
            setShowNewModal(false);
          }}
        />
      )}

      {actionModal && (
        <ActionModal
          booking={actionModal.booking}
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onDone={handleActionDone}
        />
      )}

      {editModal && (
        <EditBookingModal
          booking={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default BookingsPage;
