import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    MessageSquare,
    Loader2,
    RefreshCw,
    MoreVertical,
    Reply,
    Archive
} from 'lucide-react';
import apiService from '../services/api';

const MessageManager = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'new', label: 'New' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' }
    ];

    const priorityOptions = [
        { value: 'all', label: 'All Priorities' },
        { value: '1', label: 'Low' },
        { value: '2', label: 'Medium' },
        { value: '3', label: 'High' },
        { value: '4', label: 'Critical' }
    ];

    // Fetch messages
    const fetchMessages = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (priorityFilter !== 'all') params.priority = priorityFilter;

            const response = await apiService.getMessages(params);
            setMessages(response.results || response);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setError('Failed to load messages. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Mark message as read
    const markMessageAsRead = async (messageId) => {
        try {
            await apiService.markMessageAsRead(messageId);
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, is_read: true } : msg
            ));
        } catch (err) {
            console.error('Failed to mark message as read:', err);
        }
    };

    // Resolve message
    const resolveMessage = async (messageId) => {
        try {
            await apiService.resolveMessage(messageId);
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, status: 'resolved' } : msg
            ));
        } catch (err) {
            console.error('Failed to resolve message:', err);
        }
    };

    // Update message status
    const updateMessageStatus = async (messageId, newStatus) => {
        try {
            await apiService.updateMessage(messageId, { status: newStatus });
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, status: newStatus } : msg
            ));
        } catch (err) {
            console.error('Failed to update message status:', err);
        }
    };

    // Reply to message
    const replyToMessage = async (messageId) => {
        if (!replyText.trim()) return;

        try {
            setReplying(true);
            await apiService.updateMessage(messageId, { 
                admin_notes: replyText,
                status: 'in_progress'
            });
            
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { 
                    ...msg, 
                    admin_notes: replyText,
                    status: 'in_progress'
                } : msg
            ));
            
            setReplyText('');
            setSelectedMessage(null);
        } catch (err) {
            console.error('Failed to reply to message:', err);
        } finally {
            setReplying(false);
        }
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 4: return 'bg-red-100 text-red-800 border-red-200';
            case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
            case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'new': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Filter messages
    const filteredMessages = messages.filter(message => {
        const matchesSearch = !searchQuery || 
            message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            message.username.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || message.priority.toString() === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });

    useEffect(() => {
        fetchMessages();
    }, [statusFilter, priorityFilter]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(fetchMessages, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Message Management</h2>
                    <p className="text-gray-600">Manage user messages and support requests</p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchMessages}
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
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && fetchMessages()}
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
                        
                        <div>
                            <Label htmlFor="priority">Priority</Label>
                            <select
                                id="priority"
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {priorityOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <Button onClick={fetchMessages} className="w-full">
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

            {/* Messages List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading messages...</p>
                    </div>
                ) : filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                        <Card key={message.id} className={`${!message.is_read ? 'border-blue-300 bg-blue-50' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="font-semibold text-lg">{message.subject}</h3>
                                            <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(message.priority)}`}>
                                                {message.priority_display}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(message.status)}`}>
                                                {message.status_display}
                                            </span>
                                            {!message.is_read && (
                                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                            <span>From: {message.username}</span>
                                            <span>•</span>
                                            <span>{new Date(message.created_at).toLocaleString()}</span>
                                        </div>
                                        
                                        <p className="text-gray-700 mb-4">{message.content}</p>
                                        
                                        {message.admin_notes && (
                                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                                <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                                                <p className="text-sm text-gray-600">{message.admin_notes}</p>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center space-x-2">
                                            {!message.is_read && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => markMessageAsRead(message.id)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Mark Read
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
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                                            >
                                                <Reply className="h-3 w-3 mr-1" />
                                                Reply
                                            </Button>
                                            
                                            <select
                                                value={message.status}
                                                onChange={(e) => updateMessageStatus(message.id, e.target.value)}
                                                className="text-xs border border-gray-300 rounded px-2 py-1"
                                            >
                                                <option value="new">New</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Reply Section */}
                                {selectedMessage === message.id && (
                                    <div className="mt-4 pt-4 border-t">
                                        <Label htmlFor={`reply-${message.id}`}>Reply to {message.username}</Label>
                                        <div className="flex space-x-2 mt-2">
                                            <Input
                                                id={`reply-${message.id}`}
                                                placeholder="Type your reply..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={() => replyToMessage(message.id)}
                                                disabled={replying || !replyText.trim()}
                                            >
                                                {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedMessage(null);
                                                    setReplyText('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No messages found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageManager;
