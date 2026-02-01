'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare, User, AlertCircle } from 'lucide-react';

const TICKETS = [
    { id: 'TKT-1029', user: 'Ahmed Hassan', subject: 'Login Issues', priority: 'High', status: 'Open', created: '2 hours ago' },
    { id: 'TKT-1030', user: 'Sarah Wilson', subject: 'Refund Request', priority: 'Medium', status: 'Pending', created: '5 hours ago' },
    { id: 'TKT-1031', user: 'John Doe', subject: 'Feature Question', priority: 'Low', status: 'Closed', created: 'Yesterday' },
];

export default function SupportPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Support & Logs</h1>
                    <p className="text-xs text-gray-500 mt-1">Manage user support tickets and system logs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="rounded-[30px] p-0 overflow-hidden min-h-[400px]">
                        <div className="p-6 pb-2">
                            <h3 className="font-bold text-gray-900 text-sm">Support Tickets</h3>
                        </div>
                        <Table
                            data={TICKETS}
                            keyExtractor={(t) => t.id}
                            columns={[
                                { header: 'ID', accessor: 'id' },
                                { header: 'User', accessor: 'user' },
                                { header: 'Subject', accessor: 'subject' },
                                {
                                    header: 'Priority',
                                    accessor: (t) => (
                                        <span className={`text-xs font-semibold ${t.priority === 'High' ? 'text-red-500' : 'text-gray-500'}`}>
                                            {t.priority}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Status',
                                    accessor: (t) => (
                                        <Badge variant={t.status === 'Open' ? 'error' : t.status === 'Pending' ? 'warning' : 'neutral'}>
                                            {t.status}
                                        </Badge>
                                    )
                                },
                                {
                                    header: 'Action',
                                    accessor: () => (
                                        <Button size="sm" variant="ghost" className="text-primary hover:text-primary-600">Reply</Button>
                                    )
                                }
                            ]}
                        />
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[30px] p-6 bg-primary text-white shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-full">
                                <MessageSquare size={20} />
                            </div>
                            <h3 className="font-bold">Support Stats</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                <span className="text-xs opacity-80">Open Tickets</span>
                                <span className="font-bold text-lg">12</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                <span className="text-xs opacity-80">Avg Response</span>
                                <span className="font-bold text-lg">2.4h</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-80">Closed Today</span>
                                <span className="font-bold text-lg">8</span>
                            </div>
                        </div>
                    </div>

                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-bold text-gray-900 text-sm mb-4 flex gap-2"><AlertCircle size={16} /> System Logs</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="text-xs border-l-2 border-gray-200 pl-3 py-1">
                                    <p className="text-gray-900 font-medium">System Backup Completed</p>
                                    <p className="text-gray-400 text-[10px]">Oct 24, 02:00 AM</p>
                                </div>
                            ))}
                        </div>
                        <Button fullWidth variant="ghost" className="mt-2 text-xs">View All Logs</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
