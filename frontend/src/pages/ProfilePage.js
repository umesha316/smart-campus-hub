import React, { useState, useRef } from 'react';
import { Camera, X, Save, Lock, User, Mail, Phone, Building2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    pictureBase64: '',
  });
  const [previewImg, setPreviewImg] = useState(user?.picture || null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [showPw, setShowPw] = useState({ cur: false, new: false, con: false });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const fileRef = useRef();

  const isGoogle = user?.provider === 'GOOGLE';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setPreviewImg(b64);
      setForm(p => ({ ...p, pictureBase64: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        department: form.department,
        pictureBase64: form.pictureBase64 || undefined,
      };
      const updated = await authService.updateProfile(payload);
      updateUser(updated);
      setForm(p => ({ ...p, pictureBase64: '' }));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      return toast.error('New passwords do not match');
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setPwLoading(true);
    try {
      await authService.updateProfile({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setPwLoading(false); }
  };

  const avatarSrc = previewImg;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>My Profile</h2>
          <p>Manage your account details and security</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>

        {/* ── Profile Details Card ── */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} /> Profile Details
          </h3>

          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <div onClick={() => fileRef.current.click()} style={{
                width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                border: '3px solid var(--primary)', cursor: 'pointer', background: 'var(--bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--primary)' }}>{user?.name?.charAt(0) || 'U'}</span>}
              </div>
              <button type="button" onClick={() => fileRef.current.click()} style={{
                position: 'absolute', bottom: 2, right: 2, width: 28, height: 28,
                borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-card)',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera size={13} />
              </button>
              {form.pictureBase64 && (
                <button type="button" onClick={() => { setPreviewImg(user?.picture || null); setForm(p => ({ ...p, pictureBase64: '' })); }}
                  style={{ position: 'absolute', top: 0, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--danger)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={11} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Click avatar to change · Max 2MB</p>
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={{ paddingLeft: 34 }} required minLength={2} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control" value={user?.email || ''} disabled
                  style={{ paddingLeft: 34, opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="tel" className="form-control" placeholder="+94 77 000 0000"
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    style={{ paddingLeft: 34 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="form-control" placeholder="e.g. Computing"
                    value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    style={{ paddingLeft: 34 }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 13 }}>
              <CheckCircle size={14} color={isGoogle ? '#3b82f6' : '#10b981'} />
              <span style={{ color: 'var(--text-muted)' }}>
                Account via <strong>{isGoogle ? 'Google OAuth' : 'Local Login'}</strong> · Role: <strong>{user?.role}</strong>
              </span>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : <><Save size={14} /> Save Profile</>}
            </button>
          </form>
        </div>

        {/* ── Change Password Card ── */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} /> Change Password
          </h3>
          {isGoogle ? (
            <div style={{ marginTop: 20, padding: 20, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <Lock size={32} color="var(--text-muted)" style={{ marginBottom: 10 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Your account is linked via <strong>Google</strong>.<br />Password change is managed by Google.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} style={{ marginTop: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Update your login password. You'll need to enter your current password to confirm.
              </p>

              {[
                { label: 'Current Password', key: 'currentPassword', vis: 'cur' },
                { label: 'New Password', key: 'newPassword', vis: 'new' },
                { label: 'Confirm New Password', key: 'confirmNewPassword', vis: 'con' },
              ].map(({ label, key, vis }) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPw[vis] ? 'text' : 'password'}
                      className="form-control"
                      value={pwForm[key]}
                      onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                      style={{ paddingLeft: 34, paddingRight: 40 }}
                      required
                      minLength={key !== 'currentPassword' ? 6 : undefined}
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [vis]: !p[vis] }))}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showPw[vis] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}

              <button type="submit" className="btn btn-primary w-full" disabled={pwLoading} style={{ marginTop: 8 }}>
                {pwLoading ? <span className="spinner spinner-sm" /> : <><Lock size={14} /> Update Password</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
