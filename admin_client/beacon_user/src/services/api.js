const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('access_token');
        this.retryCount = 0;
        this.maxRetries = 3;
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
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic request method with retry logic
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: this.getAuthHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                // Try to refresh token if we have a refresh token
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken && this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    const newToken = await this.refreshToken();
                    if (newToken) {
                        // Retry the original request with new token
                        config.headers['Authorization'] = `Bearer ${newToken}`;
                        const retryResponse = await fetch(url, config);
                        this.retryCount = 0;
                        return this.handleResponse(retryResponse);
                    }
                }
                
                // If refresh failed or no refresh token, clear and redirect
                this.clearToken();
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                throw new Error('Authentication failed');
            }

            return this.handleResponse(response);
        } catch (error) {
            console.error('API request failed:', error);
            this.retryCount = 0;
            throw error;
        }
    }

    // Handle response
    async handleResponse(response) {
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        // Return text for non-JSON responses
        return await response.text();
    }

    // Authentication endpoints
    async login(username, password) {
        try {
            const response = await this.request('/auth/login/', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            
            if (response.success) {
                this.setToken(response.tokens.access);
            }
            
            return response;
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Login failed'
            };
        }
    }

    async register(userData) {
        try {
            return await this.request('/auth/register/', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Registration failed'
            };
        }
    }

    async logout() {
        try {
            await this.request('/auth/logout/', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearToken();
            localStorage.removeItem('refresh_token');
        }
    }

    // User endpoints
    async getProfile() {
        try {
            return await this.request('/auth/profile/');
        } catch (error) {
            console.error('Failed to get profile:', error);
            throw error;
        }
    }

    async updateProfile(profileData) {
        try {
            return await this.request('/auth/profile/', {
                method: 'PATCH',
                body: JSON.stringify(profileData),
            });
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    }

    async getUsers(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `/auth/users/?${queryString}` : '/auth/users/';
            return await this.request(endpoint);
        } catch (error) {
            console.error('Failed to get users:', error);
            return { results: [], count: 0 };
        }
    }

    // Message endpoints
    async getMessages(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `/auth/messages/?${queryString}` : '/auth/messages/';
            return await this.request(endpoint);
        } catch (error) {
            console.error('Failed to get messages:', error);
            return { results: [], count: 0 };
        }
    }

    async getMessage(messageId) {
        try {
            return await this.request(`/auth/messages/${messageId}/`);
        } catch (error) {
            console.error('Failed to get message:', error);
            throw error;
        }
    }

    async createMessage(messageData) {
        try {
            return await this.request('/auth/messages/', {
                method: 'POST',
                body: JSON.stringify(messageData),
            });
        } catch (error) {
            console.error('Failed to create message:', error);
            throw error;
        }
    }

    async updateMessage(messageId, messageData) {
        try {
            return await this.request(`/auth/messages/${messageId}/`, {
                method: 'PATCH',
                body: JSON.stringify(messageData),
            });
        } catch (error) {
            console.error('Failed to update message:', error);
            throw error;
        }
    }

    async deleteMessage(messageId) {
        try {
            return await this.request(`/auth/messages/${messageId}/`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Failed to delete message:', error);
            throw error;
        }
    }

    async markMessageAsRead(messageId) {
        try {
            return await this.request(`/auth/messages/${messageId}/read/`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Failed to mark message as read:', error);
            throw error;
        }
    }

    async resolveMessage(messageId) {
        try {
            return await this.request(`/auth/messages/${messageId}/resolve/`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Failed to resolve message:', error);
            throw error;
        }
    }

    // Activity endpoints
    async getActivities(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = queryString ? `/auth/activities/?${queryString}` : '/auth/activities/';
            return await this.request(endpoint);
        } catch (error) {
            console.error('Failed to get activities:', error);
            return { results: [], count: 0 };
        }
    }

    // Notification endpoints
    async getNotifications() {
        try {
            return await this.request('/auth/notifications/');
        } catch (error) {
            console.error('Failed to get notifications:', error);
            return { results: [], count: 0 };
        }
    }

    // Dashboard endpoints
    async getDashboardStats() {
        try {
            return await this.request('/auth/dashboard/stats/');
        } catch (error) {
            console.error('Failed to get dashboard stats:', error);
            return {
                total_users: 0,
                active_users: 0,
                total_messages: 0,
                unread_messages: 0,
                messages_today: 0,
                new_users_today: 0,
                system_notifications: 0
            };
        }
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

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health/`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
