'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboard, fetchRevenue, fetchActivities } from '@/store/slices/analyticsSlice';
import { Users, Crown, Activity, CreditCard, Loader2 } from 'lucide-react';

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString('fr-FR');
}

function formatCurrency(num: number): string {
    return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

function timeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
    user_registration: 'Nouvel utilisateur inscrit',
    new_match: 'Nouveau match',
    new_message: 'Nouveau message',
    swipe_action: 'Action de swipe',
    subscription_purchase: 'Nouvel abonnement',
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
    user_registration: 'bg-blue-100 text-blue-600',
    new_match: 'bg-pink-100 text-pink-600',
    new_message: 'bg-green-100 text-green-600',
    swipe_action: 'bg-amber-100 text-amber-600',
    subscription_purchase: 'bg-yellow-100 text-yellow-600',
};

export default function DashboardPage() {
    const dispatch = useAppDispatch();
    const { dashboard, revenue, activities, isLoading, error } = useAppSelector(state => state.analytics);

    useEffect(() => {
        dispatch(fetchDashboard('30d'));
        dispatch(fetchRevenue({ period: 'monthly', months: 7 }));
        dispatch(fetchActivities({ limit: 5, type: 'all' }));
    }, [dispatch]);

    const overview = dashboard.overview;

    const conversionRate = overview && overview.totalUsers > 0
        ? Math.round((overview.premiumUsers / overview.totalUsers) * 100)
        : 0;

    const metrics = overview ? [
        {
            label: 'Utilisateurs Totaux',
            value: formatNumber(overview.totalUsers),
            growth: overview.growth.users,
            icon: Users,
        },
        {
            label: 'Utilisateurs Actifs',
            value: formatNumber(overview.activeUsers),
            growth: overview.engagementRate,
            icon: Activity,
        },
        {
            label: 'Utilisateurs Premium',
            value: formatNumber(overview.premiumUsers),
            growth: conversionRate,
            icon: Crown,
        },
        {
            label: 'Revenu',
            value: formatCurrency(revenue.summary?.totalRevenue ?? overview.revenue),
            growth: revenue.summary?.growthPercentage ?? overview.growth.revenue,
            icon: CreditCard,
        },
    ] : [];

    const chartData = revenue.data.map(d => ({
        name: d.period,
        value: d.revenue,
    }));

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                    {error}
                </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading || !overview || !revenue.summary ? (
                    [1, 2, 3, 4].map((i) => (
                        <Card key={i} className="flex flex-col gap-2 animate-pulse">
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                            <div className="h-7 w-16 bg-gray-200 rounded mt-1" />
                        </Card>
                    ))
                ) : (
                    metrics.map((metric) => (
                        <Card key={metric.label} className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <metric.icon className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-500 font-medium">{metric.label}</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                                {metric.growth !== 0 && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        metric.growth > 0
                                            ? 'text-success bg-success/10'
                                            : 'text-red-600 bg-red-50'
                                    }`}>
                                        {metric.growth > 0 ? '+' : ''}{metric.growth}%
                                    </span>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <Card className="lg:col-span-2 min-h-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-6">Analytique des Revenus</h3>
                    <div className="h-80 w-full">
                        {isLoading && chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#52101b" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#52101b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        tickMargin={10}
                                        stroke="#9ca3af"
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        stroke="#9ca3af"
                                        tickFormatter={(value) => `${value}€`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}
                                        formatter={(value: any) => [`${value}€`, 'Revenu']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#52101b"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#revenueGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    {revenue.summary && (
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                                Total: <span className="font-semibold text-gray-900">{formatCurrency(revenue.summary.totalRevenue)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                                Abonnements: <span className="font-semibold text-gray-900">{revenue.summary.totalSubscriptions}</span>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Recent Activity */}
                <Card className="min-h-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Activité Récente</h3>
                    <div className="space-y-4">
                        {isLoading && activities.items.length === 0 ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 w-32 bg-gray-200 rounded" />
                                        <div className="h-2 w-20 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            ))
                        ) : activities.items.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">Aucune activité récente</p>
                        ) : (
                            activities.items.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                        ACTIVITY_TYPE_COLORS[activity.type] || 'bg-gray-100 text-gray-600'
                                    }`}>
                                        <span className="text-xs font-bold">
                                            {activity.type === 'user_registration' ? 'U' :
                                             activity.type === 'new_match' ? 'M' :
                                             activity.type === 'new_message' ? 'C' : 'S'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                            {activity.description || ACTIVITY_TYPE_LABELS[activity.type] || activity.type}
                                        </p>
                                        <p className="text-[10px] text-gray-500">{timeAgo(activity.timestamp)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
