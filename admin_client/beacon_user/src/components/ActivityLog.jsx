import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Search,
    Filter,
    Activity,
    User,
    MessageSquare,
    LogIn,
    LogOut,
    AlertCircle,
    Loader2,
    RefreshCw,
    Calendar,
    Clock
} from 'lucide-react';
import apiService from '../services/api';

const ActivityLog = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activityTypeFilter, setActivityTypeFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    const activityTypeOptions = [
        { value: 'all', label: 'All Activities' },
        { value: 'login', label: 'Login' },
        { value: 'logout', label: 'Logout' },
        { value: 'message_sent', label: 'Message Sent' },
        { value: 'message_read', label: 'Message Read' },
        { value: 'message_resolved', label: 'Message Resolved' },
        { value: 'profile_updated', label: 'Profile Updated' }
    ];

    const dateFilterOptions = [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' }
    ];

    // Fetch activities
    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (activityTypeFilter !== 'all') params.activity_type = activityTypeFilter;

            const response = await apiService.getActivities(params);
            const activitiesData = response.results || response;
            
            // Apply date filtering on frontend
            let filteredActivities = activitiesData;
            if (dateFilter !== 'all') {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

                filteredActivities = activitiesData.filter(activity => {
                    const activityDate = new Date(activity.created_at);
                    switch (dateFilter) {
                        case 'today':
                            return activityDate >= today;
                        case 'yesterday':
                            return activityDate >= yesterday && activityDate < today;
                        case 'week':
                            return activityDate >= weekAgo;
                        case 'month':
                            return activityDate >= monthAgo;
                        default:
                            return true;
                    }
                });
            }

            setActivities(filteredActivities);
        } catch (err) {
            console.error('Failed to fetch activities:', err);
            setError('Failed to load activity log. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get activity icon
    const getActivityIcon = (activityType) => {
        switch (activityType) {
            case 'login':
                return <LogIn className="h-4 w-4 text-green-500" />;
            case 'logout':
                return <LogOut className="h-4 w-4 text-red-500" />;
            case 'message_sent':
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'message_read':
                return <MessageSquare className="h-4 w-4 text-green-500" />;
            case 'message_resolved':
                return <MessageSquare className="h-4 w-4 text-purple-500" />;
            case 'profile_updated':
                return <User className="h-4 w-4 text-orange-500" />;
            default:
                return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    // Get activity color
    const getActivityColor = (activityType) => {
        switch (activityType) {
            case 'login':
                return 'border-green-200 bg-green-50';
            case 'logout':
                return 'border-red-200 bg-red-50';
            case 'message_sent':
                return 'border-blue-200 bg-blue-50';
            case 'message_read':
                return 'border-green-200 bg-green-50';
            case 'message_resolved':
                return 'border-purple-200 bg-purple-50';
            case 'profile_updated':
                return 'border-orange-200 bg-orange-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    // Format activity description
    const formatActivityDescription = (activity) => {
        const user = activity.user?.username || 'Unknown User';
        const description = activity.description || '';
        
        if (description.includes('logged in')) {
            return `${user} logged in`;
        } else if (description.includes('logged out')) {
            return `${user} logged out`;
        } else if (description.includes('Message sent')) {
            return `${user} sent a message`;
        } else if (description.includes('Message read')) {
            return `${user} read a message`;
        } else if (description.includes('Message resolved')) {
            return `${user} resolved a message`;
        } else if (description.includes('Profile updated')) {
            return `${user} updated their profile`;
        }
        
        return description;
    };

    useEffect(() => {
        fetchActivities();
    }, [activityTypeFilter, dateFilter]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(fetchActivities, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Activity Log</h2>
                    <p className="text-gray-600">Monitor user activities and system events</p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchActivities}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </Button>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="search"
                                    placeholder="Search activities..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && fetchActivities()}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <Label htmlFor="activityType">Activity Type</Label>
                            <select
                                id="activityType"
                                value={activityTypeFilter}
                                onChange={(e) => setActivityTypeFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {activityTypeOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <Label htmlFor="dateFilter">Date Range</Label>
                            <select
                                id="dateFilter"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {dateFilterOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <Button onClick={fetchActivities} className="w-full">
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

            {/* Activities List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading activities...</p>
                    </div>
                ) : activities.length > 0 ? (
                    activities.map((activity) => (
                        <Card key={activity.id} className={getActivityColor(activity.activity_type)}>
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        {getActivityIcon(activity.activity_type)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {formatActivityDescription(activity)}
                                            </h4>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                                                <Clock className="h-3 w-3" />
                                                <span>{new Date(activity.created_at).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p><span className="font-medium">User:</span> {activity.user?.username || 'Unknown'}</p>
                                            <p><span className="font-medium">IP Address:</span> {activity.ip_address || 'Unknown'}</p>
                                            {activity.user_agent && (
                                                <p className="text-xs text-gray-500 truncate">
                                                    <span className="font-medium">User Agent:</span> {activity.user_agent}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No activities found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;
