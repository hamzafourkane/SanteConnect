import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Accept': 'application/json',
    },
});

// Request interceptor to add auth token and set appropriate Content-Type
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Only set Content-Type to application/json if not sending FormData
        // FormData will automatically set the correct Content-Type with boundary
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Only redirect on 401 if not a refresh/background request
        if (error.response?.status === 401) {
            // Check if this is a page refresh or manual navigation
            const isBackgroundRequest = error.config?.params?._t; // cache-busting requests
            if (!isBackgroundRequest) {
                // Unauthorized - clear token and redirect to login
                sessionStorage.removeItem('auth_token');
                sessionStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

// Authentication API
export const authAPI = {
    register: (data) => api.post('/register', data),
    login: (credentials) => api.post('/login', credentials),
    logout: () => api.post('/logout'),
    me: () => api.get('/me'),
};

// Measurements API
export const measurementsAPI = {
    getAll: (params) => api.get('/measurements', { params }),
    create: (data) => api.post('/measurements', data),
    getStatistics: () => api.get('/measurements/statistics'),
};

// Recommendations API
export const recommendationsAPI = {
    getAll: () => api.get('/recommendations'),
};

// Consents API
export const consentsAPI = {
    getAll: () => api.get('/consents'),
    grant: (doctorId) => api.post('/consents', { doctor_id: doctorId }),
    revoke: (consentId) => api.delete(`/consents/${consentId}`),
    listDoctors: () => api.get('/doctors'),
};

// Doctor API
export const doctorAPI = {
    getPatients: () => api.get('/doctor/patients'),
    getPatientData: (patientId, params) => api.get(`/doctor/patients/${patientId}/data`, { params }),
    sendRecommendation: (patientId, message) => api.post(`/doctor/patients/${patientId}/recommendation`, { message }),
};

// Admin API
export const adminAPI = {
    getStatistics: () => api.get('/admin/statistics', { params: { _t: Date.now() } }),
    getPendingDoctors: () => api.get('/admin/doctors/pending', { params: { _t: Date.now() } }),
    getAllDoctors: () => api.get('/admin/doctors', { params: { _t: Date.now() } }),
    verifyDoctor: (doctorId) => api.post(`/admin/doctors/${doctorId}/verify`),
    rejectDoctor: (doctorId, reason) => api.post(`/admin/doctors/${doctorId}/reject`, { reason }),
    getAllUsers: () => api.get('/admin/users', { params: { _t: Date.now() } }),
    getAuditLogs: (params) => api.get('/admin/audit-logs', { params: { ...params, _t: Date.now() } }),
};

// Alerts API
export const alertsAPI = {
    getAll: (params) => api.get('/alerts', { params }),
    getUnreadCount: () => api.get('/alerts/unread-count'),
    markAsRead: (alertId) => api.post(`/alerts/${alertId}/read`),
    markAllAsRead: () => api.post('/alerts/read-all'),
};

// Notifications API
export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
    markAllAsRead: () => api.post('/notifications/read-all'),
};

// Reports API
export const reportsAPI = {
    generate: (params) => api.get('/reports/generate', { params }),
    getHtml: (params) => api.get('/reports/html', { params }),
};

export default api;
