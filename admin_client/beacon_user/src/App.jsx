import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Main App Component
const AppContent = () => {
    const { user } = useAuth();

    return (
        <Router>
            <ErrorBoundary>
                <Routes>
                    <Route
                        path="/login"
                        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/"
                        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
                    />
                    {/* Catch all route for 404 */}
                    <Route
                        path="*"
                        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
                    />
                </Routes>
            </ErrorBoundary>
        </Router>
    );
};

// Root App Component
const App = () => {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
};

export default App;
