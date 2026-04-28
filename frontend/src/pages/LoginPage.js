import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Mail, Lock, User, Camera, X } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('login');
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'USER', phone: '', department: '', pictureBase64: ''
  });
  const [previewImg, setPreviewImg] = useState(null);
  const fileRef = useRef();

  const { login } = useAuth();
  const navigate = useNavigate();

  const getRoleRedirect = (role) => role === 'ADMIN' ? '/admin/users' : '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(getRoleRedirect(data.user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPreviewImg(base64);
      setRegForm(prev => ({ ...prev, pictureBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = regForm;
      const data = await authService.register(submitData);
      login(data.user, data.token);
      toast.success('Account created successfully!');
      navigate(getRoleRedirect(data.user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Exchange access token for id_token via Google userinfo, then send to backend
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(r => r.json());

        // Send the access token to backend (backend verifies via Google API)
        const data = await authService.loginWithGoogle(tokenResponse.access_token);
        login(data.user, data.token);
        toast.success(`Welcome, ${data.user.name}!`);
        navigate(getRoleRedirect(data.user.role));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Google sign-in was cancelled or failed'),
  });

  const inputStyle = { paddingLeft: 38 };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 460 }}>
        <div className="login-logo">
          <div className="login-logo-icon"><GraduationCap size={26} /></div>
          <div className="login-logo-text">
            <h1>SmartCampus Hub</h1>
            <p>SLIIT Faculty of Computing</p>
          </div>
        </div>

        {/* Tab Switch */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 24 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: tab === t ? 'var(--bg-card)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: tab === t ? 700 : 500, fontSize: 14,
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control" placeholder="you@sliit.lk"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="form-control" placeholder="Enter your password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingLeft: 38, paddingRight: 40 }} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : 'Sign In'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', background: 'var(--bg-card)',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              {/* Google SVG Icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            {/* Profile Picture Upload */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <label className="form-label" style={{ alignSelf: 'flex-start' }}>Profile Picture <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <div onClick={() => fileRef.current.click()} style={{
                  width: 90, height: 90, borderRadius: '50%', border: '2px dashed var(--border)',
                  background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}>
                  {previewImg
                    ? <img src={previewImg} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Camera size={28} color="var(--text-muted)" />}
                </div>
                {previewImg && (
                  <button type="button" onClick={() => { setPreviewImg(null); setRegForm(p => ({ ...p, pictureBase64: '' })); }}
                    style={{ position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: 'var(--danger)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={12} />
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Click to upload · Max 2MB</p>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" placeholder="John Doe"
                  value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  style={inputStyle} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control" placeholder="you@sliit.lk"
                  value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  style={inputStyle} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-control" placeholder="+94 77 000 0000"
                  value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" className="form-control" placeholder="Computing"
                  value={regForm.department} onChange={e => setRegForm({ ...regForm, department: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={regForm.role}
                onChange={e => setRegForm({ ...regForm, role: e.target.value })}>
                <option value="USER">User</option>
                <option value="TECHNICIAN">Technician</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" placeholder="Min. 6 chars"
                  value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" placeholder="Repeat password"
                  value={regForm.confirmPassword} onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : 'Create Account'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>
          IT3030 – PAF Assignment 2026 · SLIIT
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
