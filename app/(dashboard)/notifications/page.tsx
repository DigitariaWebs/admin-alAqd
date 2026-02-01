'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Send, Clock } from 'lucide-react';

const NOTIFICATION_HISTORY = [
    { id: 1, title: 'Maintenance Update', audience: 'All Users', sent: '2 hours ago', status: 'Sent' },
    { id: 2, title: 'Welcome New Premium Features', audience: 'Premium Users', sent: 'Yesterday', status: 'Sent' },
    { id: 3, title: 'Eid Mubarak', audience: 'All Users', sent: 'Scheduled (Tomorrow)', status: 'Pending' },
];

export default function NotificationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                <p className="text-xs text-gray-500 mt-1">Send push notifications and manage alerts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Send Form */}
                <Card className="rounded-[30px] p-6 space-y-4 h-fit">
                    <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                        <Send size={16} /> Compose Notification
                    </h3>

                    <Input label="Title" placeholder="Notification Title" />
                    <Textarea label="Message" placeholder="Type your message here..." rows={4} />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Target Audience"
                            options={[
                                { value: 'all', label: 'All Users' },
                                { value: 'premium', label: 'Premium Users' },
                                { value: 'inactive', label: 'Inactive Users' },
                            ]}
                        />
                        <Select
                            label="Type"
                            options={[
                                { value: 'info', label: 'Informational' },
                                { value: 'promo', label: 'Promotional' },
                                { value: 'alert', label: 'Alert' },
                            ]}
                        />
                    </div>

                    <div className="pt-2">
                        <Button fullWidth size="md" className="rounded-full">Send Notification</Button>
                    </div>
                </Card>

                {/* History */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 pl-2">
                        <Clock size={16} /> Recent History
                    </h3>
                    <Table
                        data={NOTIFICATION_HISTORY}
                        keyExtractor={(notif) => notif.id}
                        columns={[
                            { header: 'Title', accessor: 'title' },
                            { header: 'Audience', accessor: 'audience' },
                            { header: 'Sent', accessor: 'sent' },
                            {
                                header: 'Status',
                                accessor: (n) => <Badge variant={n.status === 'Sent' ? 'success' : 'warning'}>{n.status}</Badge>
                            },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}
