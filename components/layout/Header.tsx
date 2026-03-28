'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
    toggleSidebar?: () => void;
}

export const Header = ({ toggleSidebar }: HeaderProps) => {
    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
            {/* Left: Mobile Toggle & Page Title/Breadcrumb Placeholder */}
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-full"
                    onClick={toggleSidebar}
                >
                    <Menu size={20} />
                </button>
                <h1 className="text-sm font-semibold text-gray-800 hidden sm:block">
                    Dashboard Overview
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-xs">
                        AD
                    </div>
                    <div className="hidden md:block">
                        <p className="text-xs font-semibold text-gray-900">Admin User</p>
                        <p className="text-[10px] text-gray-500">Super Admin</p>
                    </div>
                </div>
            </div>
        </header>
    );
};
