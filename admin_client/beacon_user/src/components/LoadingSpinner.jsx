import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({
    size = 'default',
    text = 'Loading...',
    className = '',
    variant = 'default'
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    };

    const variants = {
        default: 'text-primary',
        white: 'text-white',
        muted: 'text-muted-foreground'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <Loader2
                className={`animate-spin ${sizeClasses[size]} ${variants[variant]}`}
            />
            {text && (
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;
