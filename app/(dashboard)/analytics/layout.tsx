'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Lightbulb, FileText } from 'lucide-react';

const ANALYTICS_TABS = [
    { name: 'Overview',    path: '/analytics',          icon: BarChart3  },
    { name: 'AI Insights', path: '/analytics/insights', icon: Lightbulb  },
    { name: 'Reports',     path: '/analytics/reports',  icon: FileText   },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
                <p className="text-xs text-gray-500 mt-1">
                    Visualize platform performance and metrics.
                </p>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-6">
                    {ANALYTICS_TABS.map((tab) => {
                        const isActive = pathname === tab.path;
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.path}
                                href={tab.path}
                                className={`
                                    flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon size={16} />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {children}
        </div>
    );
}
