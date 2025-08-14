import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user is already logged in (from localStorage)
        const token = localStorage.getItem('access_token');
        if (token && apiService.isAuthenticated()) {
            // Verify token and get user data
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuthStatus = async () => {
        try {
            const [profileData] = await Promise.all([
                apiService.getProfile(),
            ]);

            setProfile(profileData);
            setUser({
                id: profileData.user.id,
                username: profileData.user.username,
                email: profileData.user.email,
                firstName: profileData.user.first_name,
                lastName: profileData.user.last_name,
                isStaff: profileData.user.is_staff,
                dateJoined: profileData.user.date_joined,
            });
            setError(null);
        } catch (error) {
            console.error('Auth check failed:', error);
            apiService.clearToken();
            setUser(null);
            setProfile(null);
            setError('Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);

            const result = await apiService.login(username, password);

            if (result.success) {
                // Store refresh token
                localStorage.setItem('refresh_token', result.tokens.refresh);

                // Get user profile
                await checkAuthStatus();
                return { success: true };
            } else {
                setError(result.error || 'Login failed');
                return { success: false, error: result.error || 'Login failed' };
            }
        } catch (error) {
            const errorMessage = error.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setProfile(null);
            setError(null);
            apiService.clearToken();
            localStorage.removeItem('refresh_token');
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const updatedProfile = await apiService.updateProfile(profileData);
            setProfile(updatedProfile);
            return { success: true, data: updatedProfile };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const refreshToken = async () => {
        try {
            const newToken = await apiService.refreshToken();
            if (newToken) {
                await checkAuthStatus();
                return true;
            }
            return false;
        } catch (error) {
            logout();
            return false;
        }
    };

    const value = {
        user,
        profile,
        login,
        logout,
        updateProfile,
        refreshToken,
        loading,
        error,
        isAuthenticated: !!user,
        isStaff: user?.isStaff || false,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
