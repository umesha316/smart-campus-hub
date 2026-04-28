import api from './api';

// ===== AUTH SERVICE =====
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then(r => r.data),
  loginWithGoogle: (token) => api.post('/auth/google', { token }).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  getProfile: () => api.get('/auth/me').then(r => r.data),
  updateProfile: (data) => api.put('/auth/profile', data).then(r => r.data),
};

// ===== FACILITY SERVICE =====
export const facilityService = {
  getAll: (params) => api.get('/facilities', { params }).then(r => r.data),
  getById: (id) => api.get(`/facilities/${id}`).then(r => r.data),
  create: (data) => api.post('/facilities', data).then(r => r.data),
  update: (id, data) => api.put(`/facilities/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/facilities/${id}`).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/facilities/${id}/status`, { status }).then(r => r.data),
};

// ===== BOOKING SERVICE =====
export const bookingService = {
  getAll: (params) => api.get('/bookings', { params }).then(r => r.data),
  getMyBookings: () => api.get('/bookings/my').then(r => r.data),
  getById: (id) => api.get(`/bookings/${id}`).then(r => r.data),
  create: (data) => api.post('/bookings', data).then(r => r.data),
  update: (id, data) => api.put(`/bookings/${id}`, data).then(r => r.data),
  approve: (id, reason) => api.patch(`/bookings/${id}/approve`, { reason }).then(r => r.data),
  reject: (id, reason) => api.patch(`/bookings/${id}/reject`, { reason }).then(r => r.data),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`).then(r => r.data),
  delete: (id) => api.delete(`/bookings/${id}`).then(r => r.data),
  checkConflicts: (data) => api.post('/bookings/check-conflicts', data).then(r => r.data),
  exportCsv: () => api.get('/bookings/export/csv', { responseType: 'blob' }).then(r => r.data),
  exportPdf: () => api.get('/bookings/export/pdf', { responseType: 'blob' }).then(r => r.data),
};

// ===== TICKET SERVICE =====
export const ticketService = {
  getAll: (params) => api.get('/tickets', { params }).then(r => r.data),
  getMyTickets: () => api.get('/tickets/my').then(r => r.data),
  getById: (id) => api.get(`/tickets/${id}`).then(r => r.data),
  create: (formData) => api.post('/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  update: (id, data) => api.put(`/tickets/${id}`, data).then(r => r.data),
  updateStatus: (id, status, notes) => api.patch(`/tickets/${id}/status`, { status, notes }).then(r => r.data),
  assign: (id, technicianId) => api.patch(`/tickets/${id}/assign`, { technicianId }).then(r => r.data),
  delete: (id) => api.delete(`/tickets/${id}`).then(r => r.data),
  addComment: (id, text) => api.post(`/tickets/${id}/comments`, { text }).then(r => r.data),
  editComment: (ticketId, commentId, text) => api.put(`/tickets/${ticketId}/comments/${commentId}`, { text }).then(r => r.data),
  deleteComment: (ticketId, commentId) => api.delete(`/tickets/${ticketId}/comments/${commentId}`).then(r => r.data),
  exportCsv: () => api.get('/tickets/export/csv', { responseType: 'blob' }).then(r => r.data),
  exportPdf: () => api.get('/tickets/export/pdf', { responseType: 'blob' }).then(r => r.data),
};

// ===== NOTIFICATION SERVICE =====
export const notificationService = {
  getAll: () => api.get('/notifications').then(r => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(r => r.data),
};

// ===== USER SERVICE (Admin) =====
export const userService = {
  getAll: () => api.get('/users').then(r => r.data),
  createUser: (data) => api.post('/users', data).then(r => r.data),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }).then(r => r.data),
  deleteUser: (id) => api.delete(`/users/${id}`).then(r => r.data),
  exportCsv: () => api.get('/users/export/csv', { responseType: 'blob' }).then(r => r.data),
  exportPdf: () => api.get('/users/export/pdf', { responseType: 'blob' }).then(r => r.data),
};
