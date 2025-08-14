import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Search,
    Filter,
    Users,
    UserCheck,
    UserX,
    Clock,
    AlertCircle,
    Loader2,
    RefreshCw,
    MoreVertical,
    Mail,
    Calendar,
    Activity
} from 'lucide-react';
import apiService from '../services/api';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userStats, setUserStats] = useState({
        total: 0,
        online: 0,
        offline: 0,
        newToday: 0
    });

    const statusOptions = [
        { value: 'all', label: 'All Users' },
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' }
    ];

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (statusFilter === 'online') params.online_only = 'true';

            const response = await apiService.getUsers(params);
            const usersData = response.results || response;
            setUsers(usersData);

            // Calculate stats
            const total = usersData.length;
            const online = usersData.filter(user => user.is_online).length;
            const offline = total - online;
            const today = new Date().toDateString();
            const newToday = usersData.filter(user => 
                new Date(user.user?.date_joined).toDateString() === today
            ).length;

            setUserStats({ total, online, offline, newToday });
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Toggle user status
    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            // This would require a backend endpoint to toggle user status
            // For now, we'll just update the local state
            setUsers(prev => prev.map(user => 
                user.user?.id === userId 
                    ? { ...user, is_online: !currentStatus }
                    : user
            ));
        } catch (err) {
            console.error('Failed to toggle user status:', err);
        }
    };

    // Get user status color
    const getUserStatusColor = (isOnline) => {
        return isOnline ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Get user status icon
    const getUserStatusIcon = (isOnline) => {
        return isOnline ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />;
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchQuery || 
            user.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'online' && user.is_online) ||
            (statusFilter === 'offline' && !user.is_online);
        
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        fetchUsers();
    }, [statusFilter]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(fetchUsers, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <p className="text-gray-600">Manage user accounts and monitor activity</p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchUsers}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {userStats.newToday} new today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Online Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{userStats.online}</div>
                        <p className="text-xs text-muted-foreground">
                            {userStats.total > 0 ? Math.round((userStats.online / userStats.total) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offline Users</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{userStats.offline}</div>
                        <p className="text-xs text-muted-foreground">
                            {userStats.total > 0 ? Math.round((userStats.offline / userStats.total) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Today</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{userStats.newToday}</div>
                        <p className="text-xs text-muted-foreground">
                            New registrations
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="search">Search Users</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="search"
                                    placeholder="Search by name, email, or username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <Button onClick={fetchUsers} className="w-full">
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

            {/* Users List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading users...</p>
                    </div>
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <Card key={user.user?.id} className={`${user.is_online ? 'border-green-300' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            user.is_online ? 'bg-green-100' : 'bg-gray-100'
                                        }`}>
                                            {getUserStatusIcon(user.is_online)}
                                        </div>
                                        
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {user.user?.first_name && user.user?.last_name 
                                                    ? `${user.user.first_name} ${user.user.last_name}`
                                                    : user.user?.username
                                                }
                                            </h3>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                <span className="flex items-center">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    {user.user?.email}
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Joined {new Date(user.user?.date_joined).toLocaleDateString()}
                                                </span>
                                                <span className={`px-2 py-1 text-xs rounded-full border ${getUserStatusColor(user.is_online)}`}>
                                                    {user.is_online ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleUserStatus(user.user?.id, user.is_online)}
                                        >
                                            {user.is_online ? 'Set Offline' : 'Set Online'}
                                        </Button>
                                        
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedUser(selectedUser === user.user?.id ? null : user.user?.id)}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Expanded User Details */}
                                {selectedUser === user.user?.id && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">User Details</h4>
                                                <div className="space-y-2 text-sm">
                                                    <p><span className="font-medium">Username:</span> {user.user?.username}</p>
                                                    <p><span className="font-medium">Email:</span> {user.user?.email}</p>
                                                    <p><span className="font-medium">Full Name:</span> {user.user?.first_name} {user.user?.last_name}</p>
                                                    <p><span className="font-medium">Active:</span> {user.user?.is_active ? 'Yes' : 'No'}</p>
                                                    <p><span className="font-medium">Staff:</span> {user.user?.is_staff ? 'Yes' : 'No'}</p>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">Activity</h4>
                                                <div className="space-y-2 text-sm">
                                                    <p><span className="font-medium">Last Seen:</span> {user.last_seen ? new Date(user.last_seen).toLocaleString() : 'Never'}</p>
                                                    <p><span className="font-medium">Online Status:</span> {user.is_online ? 'Currently Online' : 'Offline'}</p>
                                                    <p><span className="font-medium">Date Joined:</span> {new Date(user.user?.date_joined).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManager;
