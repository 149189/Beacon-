import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import MessageManager from '../components/MessageManager';
import UserManager from '../components/UserManager';
import NotificationPanel from '../components/NotificationPanel';
import ActivityLog from '../components/ActivityLog';
import HealthCheck from '../components/HealthCheck';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
    Menu,
    Users,
    MessageSquare,
    TrendingUp,
    Activity,
    Bell,
    Search,
    RefreshCw,
    Eye,
    CheckCircle,
    AlertCircle,
    Loader2,
    BarChart3,
    Settings
} from 'lucide-react';
import apiService from '../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

    // Real data from API
    const [stats, setStats] = useState({
        total_users: 0,
        active_users: 0,
        total_messages: 0,
        unread_messages: 0,
        messages_today: 0,
        new_users_today: 0,
        system_notifications: 0
    });

    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [statsData, usersData, messagesData, notificationsData] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getUsers({ online_only: 'true' }),
                apiService.getMessages({ limit: 10 }),
                apiService.getNotifications()
            ]);

            setStats(statsData);
            setUsers(usersData.results || usersData);
            setMessages(messagesData.results || messagesData);
            setNotifications(notificationsData.results || notificationsData);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
            showError('Dashboard Error', 'Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Mark message as read
    const markMessageAsRead = async (messageId) => {
        try {
            await apiService.markMessageAsRead(messageId);
            // Update local state
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, is_read: true } : msg
            ));
            // Refresh stats
            const newStats = await apiService.getDashboardStats();
            setStats(newStats);
            success('Message Updated', 'Message marked as read successfully.');
        } catch (err) {
            console.error('Failed to mark message as read:', err);
            showError('Update Failed', 'Failed to mark message as read.');
        }
    };

    // Resolve message
    const resolveMessage = async (messageId) => {
        try {
            await apiService.resolveMessage(messageId);
            // Update local state
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, status: 'resolved' } : msg
            ));
            // Refresh stats
            const newStats = await apiService.getDashboardStats();
            setStats(newStats);
            success('Message Resolved', 'Message resolved successfully.');
        } catch (err) {
            console.error('Failed to resolve message:', err);
            showError('Resolution Failed', 'Failed to resolve message.');
        }
    };

    // Search users
    const searchUsers = async () => {
        if (!searchQuery.trim()) {
            fetchDashboardData();
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.getUsers({ search: searchQuery });
            setUsers(response.results || response);
        } catch (err) {
            console.error('Failed to search users:', err);
            showError('Search Failed', 'Failed to search users.');
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Render active users
    const renderActiveUsers = () => {
        return (
            <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                    <div key={user.user?.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">
                                {user.user?.first_name && user.user?.last_name
                                    ? `${user.user.first_name} ${user.user.last_name}`
                                    : user.user?.username
                                }
                            </p>
                            <p className="text-xs text-gray-500">{user.user?.email}</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Online
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // Render recent messages
    const renderMessages = () => {
        return (
            <div className="space-y-3">
                {messages.slice(0, 5).map((message) => (
                    <div key={message.id} className="p-3 bg-white rounded-lg border">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="font-medium text-sm">{message.subject}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    From: {message.username} • {new Date(message.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {!message.is_read && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markMessageAsRead(message.id)}
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Read
                                    </Button>
                                )}
                                {message.status === 'new' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => resolveMessage(message.id)}
                                    >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Resolve
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render overview content
    const renderOverview = () => {
        if (loading) {
            return <LoadingSpinner size="xl" text="Loading dashboard..." />;
        }

        return (
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_users}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.new_users_today} new today
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_users}</div>
                            <p className="text-xs text-muted-foreground">
                                Currently online
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_messages}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.unread_messages} unread
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.messages_today}</div>
                            <p className="text-xs text-muted-foreground">
                                New messages today
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Users</CardTitle>
                            <CardDescription>Users currently online</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderActiveUsers()}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Messages</CardTitle>
                            <CardDescription>Latest user messages</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderMessages()}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    // Render content based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return <UserManager />;
            case 'messages':
                return <MessageManager />;
            case 'analytics':
                return (
                    <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Analytics</h2>
                        <p className="text-gray-500">Analytics dashboard coming soon...</p>
                    </div>
                );
            case 'activity':
                return <ActivityLog />;
            case 'settings':
                return (
                    <div className="text-center py-8">
                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Settings</h2>
                        <p className="text-gray-500">Settings panel coming soon...</p>
                    </div>
                );
            default:
                return renderOverview();
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden"
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {activeTab === 'overview' ? 'Dashboard' :
                                    activeTab === 'users' ? 'User Management' :
                                        activeTab === 'messages' ? 'Message Management' :
                                            activeTab === 'analytics' ? 'Analytics' :
                                                activeTab === 'activity' ? 'Activity Log' :
                                                    activeTab === 'settings' ? 'Settings' : 'Dashboard'}
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {activeTab === 'overview' && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                            {activeTab === 'overview' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchDashboardData}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            )}
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                                >
                                    <Bell className="w-5 h-5" />
                                    {notifications.filter(n => !n.is_read).length > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {notifications.filter(n => !n.is_read).length}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 px-6 py-3">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <p className="text-red-700">{error}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                className="ml-auto"
                            >
                                ×
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </main>
            </div>

            {/* Notification Panel */}
            <NotificationPanel
                isOpen={notificationPanelOpen}
                onClose={() => setNotificationPanelOpen(false)}
            />

            {/* Health Check */}
            <HealthCheck />
        </div>
    );
};

export default Dashboard;
