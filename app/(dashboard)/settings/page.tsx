'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { ToggleLeft, Lock, Globe, Database } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = React.useState('general');

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'security', label: 'Security' },
        { id: 'integrations', label: 'Integrations' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">System Settings</h1>
                <p className="text-xs text-gray-500 mt-1">Configure global application settings.</p>
            </div>

            <Card className="rounded-[30px] min-h-[500px]">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                <div className="p-6 max-w-2xl">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                                <Globe size={16} /> Platform Information
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Platform Name" defaultValue="Al-Aqd" />
                                <Input label="Support Email" defaultValue="support@al-aqd.com" />
                            </div>
                            <Input label="Default Language" defaultValue="English" />

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="font-semibold text-gray-900 text-sm mb-4">Maintenance Mode</h3>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px]">
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">Enable Maintenance Mode</p>
                                        <p className="text-xs text-gray-500">Prevent users from accessing the platform.</p>
                                    </div>
                                    <ToggleLeft size={32} className="text-gray-300 cursor-pointer" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button size="md" className="rounded-full">Save Changes</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                                <Lock size={16} /> Security Policies
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px]">
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">Two-Factor Authentication (2FA)</p>
                                        <p className="text-xs text-gray-500">Require 2FA for all admin accounts.</p>
                                    </div>
                                    <ToggleLeft size={32} className="text-primary cursor-pointer" />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px]">
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">Force Password Reset</p>
                                        <p className="text-xs text-gray-500">Require regular password updates every 90 days.</p>
                                    </div>
                                    <ToggleLeft size={32} className="text-gray-300 cursor-pointer" />
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button size="md" className="rounded-full">Update Security</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div className="space-y-6">
                            <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                                <Database size={16} /> External Services
                            </h3>

                            <Card className="p-4 rounded-[20px] border border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Stripe Payment</p>
                                    <p className="text-[10px] text-gray-500">Processing payments</p>
                                </div>
                                <Badge variant="success">Connected</Badge>
                            </Card>

                            <Card className="p-4 rounded-[20px] border border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">AWS S3 Storage</p>
                                    <p className="text-[10px] text-gray-500">File storage bucket</p>
                                </div>
                                <Badge variant="success">Connected</Badge>
                            </Card>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
