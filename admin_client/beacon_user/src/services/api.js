const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('access_token');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('access_token');
    }

    // Get auth headers
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: this.getAuthHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expired or invalid
                this.clearToken();
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async login(username, password) {
        const response = await this.request('/auth/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        
        if (response.success) {
            this.setToken(response.tokens.access);
        }
        
        return response;
    }

    async register(userData) {
        return await this.request('/auth/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
    }

    async logout() {
        try {
            await this.request('/auth/logout/', { method: 'POST' });
        } finally {
            this.clearToken();
        }
    }

    // User endpoints
    async getProfile() {
        return await this.request('/auth/profile/');
    }

    async updateProfile(profileData) {
        return await this.request('/auth/profile/', {
            method: 'PATCH',
            body: JSON.stringify(profileData),
        });
    }

    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/auth/users/?${queryString}` : '/auth/users/';
        return await this.request(endpoint);
    }

    // Message endpoints
    async getMessages(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/auth/messages/?${queryString}` : '/auth/messages/';
        return await this.request(endpoint);
    }

    async getMessage(messageId) {
        return await this.request(`/auth/messages/${messageId}/`);
    }

    async createMessage(messageData) {
        return await this.request('/auth/messages/', {
            method: 'POST',
            body: JSON.stringify(messageData),
        });
    }

    async updateMessage(messageId, messageData) {
        return await this.request(`/auth/messages/${messageId}/`, {
            method: 'PATCH',
            body: JSON.stringify(messageData),
        });
    }

    async deleteMessage(messageId) {
        return await this.request(`/auth/messages/${messageId}/`, {
            method: 'DELETE',
        });
    }

    async markMessageAsRead(messageId) {
        return await this.request(`/auth/messages/${messageId}/read/`, {
            method: 'POST',
        });
    }

    async resolveMessage(messageId) {
        return await this.request(`/auth/messages/${messageId}/resolve/`, {
            method: 'POST',
        });
    }

    // Activity endpoints
    async getActivities(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/auth/activities/?${queryString}` : '/auth/activities/';
        return await this.request(endpoint);
    }

    // Notification endpoints
    async getNotifications() {
        return await this.request('/auth/notifications/');
    }

    // Dashboard endpoints
    async getDashboardStats() {
        return await this.request('/auth/dashboard/stats/');
    }

    // Utility methods
    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${this.baseURL}/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.access);
                return data.access;
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            this.clearToken();
            throw error;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Get current token
    getToken() {
        return this.token;
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
