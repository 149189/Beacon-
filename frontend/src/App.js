import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import Map from './pages/Map';
import Settings from './pages/Settings';
import './App.css';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

const AppLayout = ({ children }) => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return (
        <div className="app-layout">
            <Navbar />
            <div className="main-content">
                <Sidebar />
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        
                        {/* Protected routes with layout */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Navigate to="/dashboard" replace />
                                </AppLayout>
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Dashboard />
                                </AppLayout>
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/incidents" element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Incidents />
                                </AppLayout>
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/incidents/:id" element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <IncidentDetail />
                                </AppLayout>
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/map" element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Map />
                                </AppLayout>
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/settings" element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Settings />
                                </AppLayout>
                            </ProtectedRoute>
                        } />
                        
                        {/* Catch all route */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
