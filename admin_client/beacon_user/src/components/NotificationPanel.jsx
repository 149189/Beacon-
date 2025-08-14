import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
    Bell,
    AlertCircle,
    Info,
    CheckCircle,
    X,
    Loader2,
    RefreshCw,
    Filter
} from 'lucide-react';
import apiService from '../services/api';

const NotificationPanel = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    const filterOptions = [
        { value: 'all', label: 'All Notifications' },
        { value: 'unread', label: 'Unread' },
        { value: 'read', label: 'Read' }
    ];

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.getNotifications();
            const notificationsData = response.results || response;
            setNotifications(notificationsData);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            // This would require a backend endpoint to mark notifications as read
            // For now, we'll just update the local state
            setNotifications(prev => prev.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, is_read: true }
                    : notification
            ));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            default:
                return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    // Get notification color
    const getNotificationColor = (type) => {
        switch (type) {
            case 'error':
                return 'border-red-200 bg-red-50';
            case 'success':
                return 'border-green-200 bg-green-50';
            case 'warning':
                return 'border-yellow-200 bg-yellow-50';
            default:
                return 'border-blue-200 bg-blue-50';
        }
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.is_read;
        if (filter === 'read') return notification.is_read;
        return true;
    });

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Auto-refresh every 30 seconds when open
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            
            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <Bell className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Notifications</h2>
                            {notifications.filter(n => !n.is_read).length > 0 && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                    {notifications.filter(n => !n.is_read).length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchNotifications}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {filterOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <p className="text-red-700 text-sm">{error}</p>
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

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p className="text-gray-500">Loading notifications...</p>
                            </div>
                        ) : filteredNotifications.length > 0 ? (
                            <div className="space-y-3">
                                {filteredNotifications.map((notification) => (
                                    <Card 
                                        key={notification.id} 
                                        className={`${getNotificationColor(notification.type)} ${!notification.is_read ? 'ring-2 ring-blue-500' : ''}`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start space-x-3">
                                                {getNotificationIcon(notification.type)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="text-sm font-medium text-gray-900">
                                                            {notification.title || 'System Notification'}
                                                        </h4>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(notification.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {notification.message || notification.content}
                                                    </p>
                                                    {!notification.is_read && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-xs"
                                                        >
                                                            Mark as Read
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No notifications found</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                // Mark all as read
                                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                            }}
                        >
                            Mark All as Read
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
