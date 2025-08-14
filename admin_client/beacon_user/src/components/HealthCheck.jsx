import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import apiService from '../services/api';

const HealthCheck = () => {
    const [status, setStatus] = useState('checking'); // 'checking', 'online', 'offline', 'error'
    const [lastCheck, setLastCheck] = useState(null);

    const checkHealth = async () => {
        try {
            setStatus('checking');
            const isHealthy = await apiService.healthCheck();
            setStatus(isHealthy ? 'online' : 'offline');
            setLastCheck(new Date());
        } catch (error) {
            setStatus('error');
            setLastCheck(new Date());
        }
    };

    useEffect(() => {
        checkHealth();
        
        // Check every 30 seconds
        const interval = setInterval(checkHealth, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = () => {
        switch (status) {
            case 'online':
                return <Wifi className="w-4 h-4 text-green-600" />;
            case 'offline':
                return <WifiOff className="w-4 h-4 text-red-600" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-yellow-600" />;
            default:
                return <Wifi className="w-4 h-4 text-gray-400 animate-pulse" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'online':
                return 'API Online';
            case 'offline':
                return 'API Offline';
            case 'error':
                return 'Connection Error';
            default:
                return 'Checking...';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'online':
                return 'text-green-600';
            case 'offline':
                return 'text-red-600';
            case 'error':
                return 'text-yellow-600';
            default:
                return 'text-gray-400';
        }
    };

    if (status === 'online') {
        return null; // Don't show when everything is working
    }

    return (
        <div className="fixed bottom-4 left-4 z-40">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center space-x-2">
                {getStatusIcon()}
                <div className="text-sm">
                    <div className={`font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </div>
                    {lastCheck && (
                        <div className="text-xs text-gray-500">
                            Last check: {lastCheck.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealthCheck;
