import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
    children,
    className = '',
    padding = 'md'
}: CardProps) => {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div className={`bg-white rounded-[30px] border border-gray-100 shadow-sm ${paddings[padding]} ${className}`}>
            {children}
        </div>
    );
};
