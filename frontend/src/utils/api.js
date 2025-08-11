import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
                        refresh: refreshToken
                    });
                    
                    const { access } = response.data;
                    localStorage.setItem('access_token', access);
                    
                    // Retry the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

// API endpoints
export const endpoints = {
    // Authentication
    register: '/auth/register/',
    login: '/auth/login/',
    profile: '/auth/profile/',
    tokenRefresh: '/auth/token/refresh/',
    tokenVerify: '/auth/token/verify/',
    
    // Incidents
    incidents: '/incidents/',
    incidentDetail: (id) => `/incidents/${id}/`,
    incidentUpdates: (id) => `/incidents/${id}/updates/`,
    
    // Health check
    health: '/health/',
    testIncidents: '/test/incidents/',
};

// Helper functions
export const authAPI = {
    register: (userData) => api.post(endpoints.register, userData),
    login: (credentials) => api.post(endpoints.login, credentials),
    getProfile: () => api.get(endpoints.profile),
    updateProfile: (userData) => api.put(endpoints.profile, userData),
    refreshToken: (refreshToken) => api.post(endpoints.tokenRefresh, { refresh: refreshToken }),
    verifyToken: (token) => api.post(endpoints.tokenVerify, { token }),
};

export const incidentAPI = {
    getIncidents: (params) => api.get(endpoints.incidents, { params }),
    createIncident: (incidentData) => api.post(endpoints.incidents, incidentData),
    getIncident: (id) => api.get(endpoints.incidentDetail(id)),
    updateIncident: (id, incidentData) => api.put(endpoints.incidentDetail(id), incidentData),
    deleteIncident: (id) => api.delete(endpoints.incidentDetail(id)),
    addUpdate: (incidentId, message) => api.post(endpoints.incidentUpdates(incidentId), { message }),
};

export default api;
