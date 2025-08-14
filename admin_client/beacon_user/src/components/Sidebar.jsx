import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Home,
    UserCheck,
    MessageCircle,
    Activity
} from 'lucide-react';

const Sidebar = ({ isOpen, onToggle, activeTab, onTabChange }) => {
    const { user, logout } = useAuth();

    const navigation = [
        { id: 'overview', label: 'Dashboard', icon: Home, href: '/dashboard' },
        { id: 'users', label: 'User Management', icon: UserCheck, href: '/dashboard/users' },
        { id: 'messages', label: 'Message Management', icon: MessageCircle, href: '/dashboard/messages' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
        { id: 'activity', label: 'Activity Log', icon: Activity, href: '/dashboard/activity' },
        { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-lg font-bold text-primary-foreground">B</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Beacon Admin</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggle}
                            className="lg:hidden"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.id}
                                    variant={activeTab === item.id ? 'secondary' : 'ghost'}
                                    className={`w-full justify-start ${activeTab === item.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-gray-100'
                                        }`}
                                    onClick={() => onTabChange(item.id)}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.label}
                                </Button>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-primary-foreground">
                                    {user?.firstName ? user.firstName[0] : user?.username?.[0] || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.firstName && user?.lastName 
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.username || 'Admin User'
                                    }
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email || 'admin@beacon.com'}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
