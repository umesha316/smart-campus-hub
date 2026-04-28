import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FacilitiesPage from './pages/FacilitiesPage';
import BookingsPage from './pages/BookingsPage';
import TicketsPage from './pages/TicketsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = ({ children, adminOnly, technicianOrAdmin }) => {
  const { user, loading, isAdmin, isTechnician } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/dashboard" replace />;
  if (technicianOrAdmin && !isTechnician()) return <Navigate to="/dashboard" replace />;
  return children;
};

// Smart home redirect based on role
const HomeRedirect = () => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin()) return <Navigate to="/admin/users" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <HomeRedirect /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <NotificationProvider>
            <AppLayout />
          </NotificationProvider>
        </ProtectedRoute>
      }>
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="facilities" element={<FacilitiesPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/users" element={
          <ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>
        } />
        <Route path="admin/settings" element={
          <ProtectedRoute adminOnly><AdminSettingsPage /></ProtectedRoute>
        } />
        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId="49936066624-i5ipmml0ak2d2p9f7733qgkkadrmh4p5.apps.googleusercontent.com">
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
