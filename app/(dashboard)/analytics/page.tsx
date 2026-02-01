'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const SALES_DATA = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
];

const USER_GROWTH = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 800 },
    { name: 'Mar', users: 1200 },
    { name: 'Apr', users: 1600 },
    { name: 'May', users: 2400 },
];

const PIE_DATA = [
    { name: 'Mobile', value: 400 },
    { name: 'Desktop', value: 300 },
    { name: 'Tablet', value: 300 },
];

const COLORS = ['#52101b', '#D4A574', '#A3A3A3'];

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Analytics & Reports</h1>
                    <p className="text-xs text-gray-500 mt-1">Visualize platform performance and metrics.</p>
                </div>
                <div className="w-40">
                    <Select
                        options={[
                            { value: '7d', label: 'Last 7 Days' },
                            { value: '30d', label: 'Last 30 Days' },
                            { value: '90d', label: 'Last 3 Months' },
                        ]}
                        className="mb-0"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="rounded-[30px] p-6 h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-900 mb-6">Revenue Over Time</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={SALES_DATA}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#52101b" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#52101b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tickMargin={10} stroke="#9ca3af" />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px', color: '#111827' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#52101b" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* User Growth Chart */}
                <Card className="rounded-[30px] p-6 h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-900 mb-6">User Growth</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={USER_GROWTH}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tickMargin={10} stroke="#9ca3af" />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f9fafb' }}
                            />
                            <Bar dataKey="users" fill="#D4A574" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[30px] p-6 h-[300px]">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Device Usage</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={PIE_DATA}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {PIE_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
}
