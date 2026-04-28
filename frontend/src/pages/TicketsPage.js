import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, AlertTriangle, X, MessageSquare, Paperclip, User, Download, FileText, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ticketService, userService } from '../services';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITY_BADGE = { LOW: 'badge-green', MEDIUM: 'badge-amber', HIGH: 'badge-red', CRITICAL: 'badge-red' };
const STATUS_BADGE = { OPEN: 'badge-red', IN_PROGRESS: 'badge-amber', RESOLVED: 'badge-green', CLOSED: 'badge-gray', REJECTED: 'badge-gray' };
const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const CATEGORIES = ['EQUIPMENT', 'MAINTENANCE', 'SECURITY', 'SUPPLIES', 'ELECTRICAL', 'PLUMBING', 'OTHER'];

/* ─── Create Ticket Modal ─────────────────────────────────────── */
const TicketFormModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '', category: 'EQUIPMENT', description: '', priority: 'MEDIUM',
    location: '', contactPhone: ''
  });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 3);
    setFiles(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('attachments', f));
      const result = await ticketService.create(fd);
      toast.success('Incident ticket submitted!');
      onSave(result || { ...form, id: Date.now(), status: 'OPEN', createdAt: new Date().toISOString(), comments: [] });
    } catch {
      onSave({ ...form, id: Date.now(), status: 'OPEN', createdAt: new Date().toISOString(), comments: [], attachments: files.map(f => f.name) });
      toast.success('Ticket submitted (demo mode)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Report New Incident</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Issue Title <span className="required">*</span></label>
              <input className="form-control" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Brief description of the issue" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category <span className="required">*</span></label>
                <select className="form-control" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority <span className="required">*</span></label>
                <select className="form-control" value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-control" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Block A, Lab 101" />
            </div>
            <div className="form-group">
              <label className="form-label">Detailed Description <span className="required">*</span></label>
              <textarea className="form-control" rows={4} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue in detail..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input className="form-control" value={form.contactPhone}
                onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="Your contact number" />
            </div>
            <div className="form-group">
              <label className="form-label">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Paperclip size={14} /> Attachments (up to 3 images)
                </div>
              </label>
              <div className="file-upload-zone" onClick={() => document.getElementById('ticket-files').click()}>
                <Paperclip size={24} />
                <p>Click to upload images (JPG, PNG, GIF)</p>
                <span>Max 3 files · 5MB each</span>
                <input id="ticket-files" type="file" multiple accept="image/*"
                  style={{ display: 'none' }} onChange={handleFiles} />
              </div>
              {files.length > 0 && (
                <div className="file-list">
                  {files.map((f, i) => (
                    <div key={i} className="file-item">
                      <Paperclip size={14} />
                      <span>{f.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)}KB</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner spinner-sm" /> : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Edit Ticket Modal (Admin) ───────────────────────────────── */
const EditTicketModal = ({ ticket, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: ticket.title || '',
    category: ticket.category || 'EQUIPMENT',
    description: ticket.description || '',
    priority: ticket.priority || 'MEDIUM',
    location: ticket.location || '',
    contactPhone: ticket.contactPhone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await ticketService.update(ticket.id, form);
      toast.success('Ticket updated successfully');
      onSave(result || { ...ticket, ...form });
    } catch {
      toast.success('Ticket updated (demo mode)');
      onSave({ ...ticket, ...form });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Edit Ticket <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>#{ticket.id}</span></h3>
          <button className="btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Issue Title <span className="required">*</span></label>
              <input className="form-control" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-control" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Detailed Description <span className="required">*</span></label>
              <textarea className="form-control" rows={4} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input className="form-control" value={form.contactPhone}
                onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
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

/* ─── Ticket Detail Modal ─────────────────────────────────────── */
const TicketDetailModal = ({ ticket, onClose, onUpdate, isTechnician }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localTicket, setLocalTicket] = useState(ticket);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await ticketService.updateStatus(ticket.id, newStatus, statusNote);
      const updated = { ...localTicket, status: newStatus, resolutionNotes: newStatus === 'RESOLVED' ? statusNote : localTicket.resolutionNotes };
      setLocalTicket(updated);
      onUpdate(updated);
      toast.success(`Status updated to ${newStatus}`);
      setStatusNote('');
    } catch {
      const updated = { ...localTicket, status: newStatus };
      setLocalTicket(updated);
      onUpdate(updated);
      toast.success('Status updated (demo mode)');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = {
        id: Date.now(), author: user?.name || 'You',
        text: comment.trim(), createdAt: new Date().toISOString()
      };
      try { await ticketService.addComment(ticket.id, comment); } catch { }
      setLocalTicket(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
      setComment('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const nextStatuses = STATUS_FLOW.filter(s => STATUS_FLOW.indexOf(s) > STATUS_FLOW.indexOf(localTicket.status));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>#{localTicket.id}</span>
            <h3 style={{ marginTop: 2 }}>{localTicket.title}</h3>
          </div>
          <button className="btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div>
            <div className="detail-section">
              <h4>Description</h4>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{localTicket.description}</p>
            </div>

            {localTicket.resolutionNotes && (
              <div className="detail-section" style={{ marginTop: 16 }}>
                <h4 style={{ color: 'var(--success)' }}>Resolution Notes</h4>
                <div style={{ background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 14, color: 'var(--text-secondary)' }}>
                  {localTicket.resolutionNotes}
                </div>
              </div>
            )}

            {isTechnician && localTicket.status !== 'CLOSED' && localTicket.status !== 'RESOLVED' && (
              <div className="detail-section" style={{ marginTop: 16 }}>
                <h4>Update Status</h4>
                {(localTicket.status === 'IN_PROGRESS') && (
                  <div className="form-group">
                    <label className="form-label">Resolution Notes</label>
                    <textarea className="form-control" rows={2} value={statusNote}
                      onChange={e => setStatusNote(e.target.value)} placeholder="Add resolution details..." />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {nextStatuses.map(s => (
                    <button key={s} className="btn btn-sm"
                      style={{
                        background: s === 'RESOLVED' ? 'var(--success-bg)' : 'var(--primary-bg)',
                        color: s === 'RESOLVED' ? 'var(--success)' : 'var(--primary)'
                      }}
                      onClick={() => handleStatusUpdate(s)} disabled={updating}>
                      → {s.replace('_', ' ')}
                    </button>
                  ))}
                  {isTechnician && localTicket.status !== 'REJECTED' && (
                    <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                      onClick={() => handleStatusUpdate('REJECTED')} disabled={updating}>
                      Reject
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="detail-section" style={{ marginTop: 16 }}>
              <h4>Comments ({(localTicket.comments || []).length})</h4>
              <div className="comments-section">
                {(localTicket.comments || []).map(c => (
                  <div key={c.id} className="comment">
                    <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                      {c.author?.charAt(0) || 'U'}
                    </div>
                    <div className="comment-bubble">
                      <div className="comment-author">{c.author}</div>
                      <div className="comment-text">{c.text}</div>
                      <div className="comment-time">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</div>
                    </div>
                  </div>
                ))}
                {(localTicket.comments || []).length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No comments yet. Be the first to comment.</p>
                )}
              </div>
              <div className="comment-input-row">
                <input className="form-control" value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..." onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
                <button className="btn btn-primary" onClick={handleAddComment} disabled={submittingComment || !comment.trim()}>
                  {submittingComment ? <span className="spinner spinner-sm" /> : <MessageSquare size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="detail-section">
              <h4>Details</h4>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`badge ${STATUS_BADGE[localTicket.status]}`}>{localTicket.status?.replace('_', ' ')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Priority</span>
                <span className={`badge ${PRIORITY_BADGE[localTicket.priority]}`}>{localTicket.priority}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category</span>
                <span className="detail-value">{localTicket.category}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Location</span>
                <span className="detail-value">{localTicket.location || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reported By</span>
                <span className="detail-value">{localTicket.createdBy || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assigned To</span>
                <span className="detail-value">{localTicket.assignedTo || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created</span>
                <span className="detail-value" style={{ fontSize: 12 }}>
                  {localTicket.createdAt ? formatDistanceToNow(new Date(localTicket.createdAt), { addSuffix: true }) : '—'}
                </span>
              </div>
            </div>

            {localTicket.attachments?.length > 0 && (
              <div className="detail-section">
                <h4>Attachments</h4>
                <div className="file-list">
                  {localTicket.attachments.map((a, i) => (
                    <div key={i} className="file-item">
                      <Paperclip size={13} />
                      <span style={{ fontSize: 12 }}>{typeof a === 'string' ? a : a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────── */
const TicketsPage = () => {
  const { isAdmin, isTechnician } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editTicket, setEditTicket] = useState(null);
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
      const blob = await ticketService.exportCsv();
      downloadBlob(blob, 'incidents_report.csv');
      toast.success('CSV downloaded!');
    } catch { toast.error('CSV export failed'); }
    finally { setExportLoading(p => ({ ...p, csv: false })); }
  };

  const handleExportPdf = async () => {
    setExportLoading(p => ({ ...p, pdf: true }));
    try {
      const blob = await ticketService.exportPdf();
      downloadBlob(blob, 'incidents_report.pdf');
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF export failed'); }
    finally { setExportLoading(p => ({ ...p, pdf: false })); }
  };

  const load = useCallback(async () => {
    try {
      const data = (isAdmin() || isTechnician()) ? await ticketService.getAll() : await ticketService.getMyTickets();
      setTickets(Array.isArray(data) ? data : (data.content || []));
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await ticketService.delete(id);
      toast.success('Ticket deleted');
    } catch { toast.success('Ticket deleted (demo mode)'); }
    setTickets(prev => prev.filter(t => t.id !== id));
  };

  const handleEditSave = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditTicket(null);
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Incident Tickets</h2>
          <p>Report and track facility maintenance issues</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {(isAdmin() || isTechnician()) && (
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
            <Plus size={16} /> Report Incident
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input className="search-input" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.replace('_', ' ')}</option>
          ))}
        </select>
        <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
            <option key={p} value={p}>{p === 'ALL' ? 'All Priority' : p}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} tickets</span>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ height: '40vh' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><AlertTriangle size={28} /></div>
          <h3>No tickets found</h3>
          <p>Report a new incident to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}><Plus size={16} /> Report Incident</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filtered.map(ticket => (
            <div key={ticket.id} className="ticket-card" onClick={() => setSelectedTicket(ticket)} style={{ cursor: 'pointer', position: 'relative' }}>
              <div className="ticket-header">
                <div>
                  <div className="ticket-id">#{ticket.id} · {ticket.category}</div>
                  <div className="ticket-title">{ticket.title}</div>
                </div>
                <span className={`badge ${PRIORITY_BADGE[ticket.priority]}`}>{ticket.priority}</span>
              </div>
              <p className="ticket-desc">{ticket.description}</p>
              <div className="ticket-footer">
                <div className="ticket-meta">
                  {ticket.location && <span>📍 {ticket.location}</span>}
                  <span>
                    {ticket.comments?.length || 0} <MessageSquare size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </span>
                </div>
                <span className={`badge ${STATUS_BADGE[ticket.status]}`}>{ticket.status?.replace('_', ' ')}</span>
              </div>
              {ticket.assignedTo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  <User size={12} /> Assigned to {ticket.assignedTo}
                </div>
              )}
              {/* Admin Edit / Delete buttons */}
              {isAdmin() && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={e => { e.stopPropagation(); setEditTicket(ticket); }}
                    style={{ flex: 1 }}
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--danger-bg)', color: 'var(--danger)', flex: 1 }}
                    onClick={e => handleDelete(ticket.id, e)}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewModal && (
        <TicketFormModal
          onClose={() => setShowNewModal(false)}
          onSave={saved => {
            setTickets(prev => [saved, ...prev]);
            setShowNewModal(false);
          }}
        />
      )}

      {editTicket && (
        <EditTicketModal
          ticket={editTicket}
          onClose={() => setEditTicket(null)}
          onSave={handleEditSave}
        />
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          isTechnician={isTechnician()}
          onClose={() => setSelectedTicket(null)}
          onUpdate={updated => {
            setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTicket(updated);
          }}
        />
      )}
    </div>
  );
};

export default TicketsPage;
