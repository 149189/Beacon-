import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
    Menu,
    Users,
    MessageSquare,
    TrendingUp,
    Activity,
    Bell,
    Search
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Mock data for demonstration
    const [stats] = useState({
        totalUsers: 1247,
        activeUsers: 892,
        totalMessages: 3456,
        messagesToday: 234
    });

    const [recentUsers] = useState([
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'online', lastSeen: '2 min ago' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'online', lastSeen: '5 min ago' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'offline', lastSeen: '1 hour ago' },
        { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', status: 'online', lastSeen: '10 min ago' },
    ]);

    const [recentMessages] = useState([
        { id: 1, user: 'John Doe', message: 'Hello, I need help with my account', time: '2 min ago', unread: true },
        { id: 2, user: 'Jane Smith', message: 'Thank you for the quick response!', time: '15 min ago', unread: false },
        { id: 3, user: 'Mike Johnson', message: 'Is there a way to reset my password?', time: '1 hour ago', unread: true },
        { id: 4, user: 'Sarah Wilson', message: 'The new feature is working great!', time: '2 hours ago', unread: false },
    ]);

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +12% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total users
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +8% from last week
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.messagesToday}</div>
                        <p className="text-xs text-muted-foreground">
                            +23% from yesterday
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>Latest user activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center space-x-4">
                                    <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {user.lastSeen}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Messages */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Messages</CardTitle>
                        <CardDescription>Latest user messages</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentMessages.map((message) => (
                                <div key={message.id} className="flex items-start space-x-4">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${message.unread ? 'bg-blue-500' : 'bg-gray-400'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            {message.user}
                                        </p>
                                        <p className="text-sm text-gray-600 truncate">
                                            {message.message}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {message.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderActiveUsers = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Active Users</CardTitle>
                    <CardDescription>Currently online users and their activity</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-3 h-3 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                        }`} />
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {user.status === 'online' ? 'Online' : `Last seen ${user.lastSeen}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderMessages = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>All user messages and conversations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentMessages.map((message) => (
                            <div key={message.id} className={`p-4 border rounded-lg ${message.unread ? 'bg-blue-50 border-blue-200' : ''
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium">{message.user}</p>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">{message.time}</span>
                                        {message.unread && (
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                New
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-700">{message.message}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return renderActiveUsers();
            case 'messages':
                return renderMessages();
            default:
                return renderOverview();
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

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
                                    activeTab === 'users' ? 'Active Users' :
                                        activeTab === 'messages' ? 'Messages' : 'Dashboard'}
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <Button variant="ghost" size="sm">
                                <Bell className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
