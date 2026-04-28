import React, { useState } from 'react';
import { Settings, Bell, Shield, Database, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    allowSelfRegistration: true,
    requireAdminApproval: true,
    maxBookingDays: 30,
    maxBookingHours: 8,
    emailNotifications: true,
    systemName: 'Smart Campus Hub',
    supportEmail: 'support@sliit.lk',
    maxAttachmentSize: 5,
    maxAttachments: 3,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  const Section = ({ icon, title, children }) => (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'var(--primary)' }}>{icon}</div>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );

  const Toggle = ({ label, desc, checked, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <div
        onClick={onChange}
        style={{
          width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
          background: checked ? 'var(--primary)' : 'var(--bg-muted)', position: 'relative',
          flexShrink: 0
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>System Settings</h2>
          <p>Configure Smart Campus Hub behavior and policies</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      <Section icon={<Settings size={18} />} title="General Settings">
        <div className="form-group">
          <label className="form-label">System Name</label>
          <input className="form-control" value={settings.systemName}
            onChange={e => setSettings({ ...settings, systemName: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Support Email</label>
          <input type="email" className="form-control" value={settings.supportEmail}
            onChange={e => setSettings({ ...settings, supportEmail: e.target.value })} />
        </div>
      </Section>

      <Section icon={<Shield size={18} />} title="Access & Security">
        <Toggle
          label="Allow Self Registration"
          desc="Users can create accounts without admin invitation"
          checked={settings.allowSelfRegistration}
          onChange={() => setSettings(s => ({ ...s, allowSelfRegistration: !s.allowSelfRegistration }))}
        />
        <Toggle
          label="Require Admin Approval for Bookings"
          desc="All booking requests must be approved by an admin"
          checked={settings.requireAdminApproval}
          onChange={() => setSettings(s => ({ ...s, requireAdminApproval: !s.requireAdminApproval }))}
        />
      </Section>

      <Section icon={<Database size={18} />} title="Booking Policies">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Max Advance Booking (days)</label>
            <input type="number" className="form-control" value={settings.maxBookingDays}
              onChange={e => setSettings({ ...settings, maxBookingDays: e.target.value })} min="1" max="365" />
            <span className="form-hint">Users can book up to {settings.maxBookingDays} days in advance</span>
          </div>
          <div className="form-group">
            <label className="form-label">Max Booking Duration (hours)</label>
            <input type="number" className="form-control" value={settings.maxBookingHours}
              onChange={e => setSettings({ ...settings, maxBookingHours: e.target.value })} min="1" max="24" />
            <span className="form-hint">Maximum {settings.maxBookingHours} hours per booking</span>
          </div>
        </div>
      </Section>

      <Section icon={<Bell size={18} />} title="Notifications">
        <Toggle
          label="Email Notifications"
          desc="Send email alerts for booking and ticket updates"
          checked={settings.emailNotifications}
          onChange={() => setSettings(s => ({ ...s, emailNotifications: !s.emailNotifications }))}
        />
      </Section>

      <Section icon={<Database size={18} />} title="Attachment Settings">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Max File Size (MB)</label>
            <input type="number" className="form-control" value={settings.maxAttachmentSize}
              onChange={e => setSettings({ ...settings, maxAttachmentSize: e.target.value })} min="1" max="20" />
          </div>
          <div className="form-group">
            <label className="form-label">Max Attachments Per Ticket</label>
            <input type="number" className="form-control" value={settings.maxAttachments}
              onChange={e => setSettings({ ...settings, maxAttachments: e.target.value })} min="1" max="10" />
          </div>
        </div>
      </Section>

      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave}>
          <Save size={18} /> Save All Settings
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
