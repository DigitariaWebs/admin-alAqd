'use client';

import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const REVENUE_DATA = [
    { name: 'Lun', value: 4000 },
    { name: 'Mar', value: 3000 },
    { name: 'Mer', value: 5000 },
    { name: 'Jeu', value: 2780 },
    { name: 'Ven', value: 1890 },
    { name: 'Sam', value: 6390 },
    { name: 'Dim', value: 3490 },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="flex flex-col gap-2">
                        <span className="text-xs text-gray-500 font-medium">Utilisateurs Totaux</span>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-gray-900">1,234</span>
                            <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">+12%</span>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <Card className="lg:col-span-2 min-h-[400px]">
                    <h3 className="text-sm font-semibold text-gray-800 mb-6">Analytique des Revenus</h3>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={REVENUE_DATA}>
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
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="min-h-[400px]">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Activité Récente</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">Nouvel utilisateur inscrit</p>
                                    <p className="text-[10px] text-gray-500">Il y a 2 minutes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
