'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import {
    LayoutDashboard,
    Users,
    FileText,
    ShoppingCart,
    BarChart2,
    Bell,
    Settings,
    LifeBuoy,
    LogOut,
    ChevronRight,
    Sparkles,
    Shield
} from 'lucide-react';
import { Assets } from '@/config/assets';

const MENU_ITEMS = [
    { name: 'Tableau de bord', icon: LayoutDashboard, path: '/' },
    { name: 'Utilisateurs', icon: Users, path: '/users' },
    { name: 'Tuteurs / Mahram', icon: Shield, path: '/guardians' },
    { name: 'Gestion de contenu', icon: FileText, path: '/content' },
    { name: 'Données d\'inscription', icon: Sparkles, path: '/content/onboarding' },
    { name: 'Commandes', icon: ShoppingCart, path: '/orders' },
    { name: 'Analytique', icon: BarChart2, path: '/analytics' },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Paramètres', icon: Settings, path: '/settings' },
    { name: 'Support & Logs', icon: LifeBuoy, path: '/support' },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const handleLogout = async () => {
        const { logout } = await import('@/store/slices/authSlice');
        await dispatch(logout());
        router.push('/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 overflow-y-auto hidden md:flex">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    {/* Placeholder for Logo if image not loaded, or use text */}
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
                        AQ
                    </div>
                    <span className="font-bold text-gray-900 text-sm tracking-wide">AL-AQD ADMIN</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {MENU_ITEMS.map((item) => {
                    // Prevent double highlighting for nested paths
                    const isNestedParams = item.path === '/content' && pathname.startsWith('/content/onboarding');
                    const isActive = !isNestedParams && (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path)));

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`
                group flex items-center justify-between px-3 py-2.5 rounded-full text-xs font-medium transition-all duration-200
                ${isActive
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }
              `}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                                <span>{item.name}</span>
                            </div>
                            {isActive && <ChevronRight size={14} className="text-white/80" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Profile Summary */}
            <div className="p-4 border-t border-gray-50">
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors group"
                >
                    <LogOut size={16} />
                    <span className="text-xs font-medium">Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};
