'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function UserDetailsPage({ params }: { params: { id: string } }) {
    // Mock User Data for user {params.id}
    const user = {
        id: params.id,
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        phone: '+1 (555) 123-4567',
        role: 'Admin',
        status: 'Active',
        joined: 'October 15, 2023',
        location: 'Casablanca, Morocco',
        lastActive: '2 hours ago',
        avatar: 'S',
        verification: 'Verified',
    };

    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'activity', label: 'Activity Log' },
        { id: 'security', label: 'Security & Privacy' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/users" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            {user.name}
                            <Badge variant="success" size="sm">{user.status}</Badge>
                        </h1>
                        <p className="text-xs text-gray-500">User ID: {user.id} • Last active: {user.lastActive}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="md" className="rounded-full text-xs">Reset Password</Button>
                    <Button variant="danger" size="md" className="rounded-full text-xs">Suspend User</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Sidebar: Profile Summary */}
                <div className="space-y-6">
                    <Card className="flex flex-col items-center text-center p-6 bg-white rounded-[30px]">
                        <div className="w-24 h-24 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-3xl mb-4 ring-4 ring-white shadow-sm">
                            {user.avatar}
                        </div>
                        <h2 className="font-bold text-gray-900">{user.name}</h2>
                        <p className="text-xs text-gray-500 mb-4">{user.role}</p>

                        <div className="w-full space-y-3 mt-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                <Phone size={14} className="text-gray-400" />
                                <span>{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                <MapPin size={14} className="text-gray-400" />
                                <span>{user.location}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                <Calendar size={14} className="text-gray-400" />
                                <span>Joined {user.joined}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white rounded-[30px]">
                        <h3 className="font-semibold text-sm mb-4">Verification Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[20px]">
                                <div className="flex items-center gap-3">
                                    <Shield size={16} className="text-success" />
                                    <span className="text-xs font-medium">Identity/CIN</span>
                                </div>
                                <CheckCircle size={14} className="text-success" />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[20px]">
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-success" />
                                    <span className="text-xs font-medium">Phone Number</span>
                                </div>
                                <CheckCircle size={14} className="text-success" />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[20px]">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-warning" />
                                    <span className="text-xs font-medium">Email Address</span>
                                </div>
                                <AlertTriangle size={14} className="text-warning" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Content: Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="min-h-[500px] rounded-[30px]">
                        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                        <div className="py-6">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-[20px]">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Orders</span>
                                            <p className="text-lg font-bold text-gray-900 mt-1">24</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-[20px]">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active Matches</span>
                                            <p className="text-lg font-bold text-gray-900 mt-1">3</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-[20px]">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Spent</span>
                                            <p className="text-lg font-bold text-gray-900 mt-1">$450</p>
                                        </div>
                                    </div>

                                    {/* Bio / About */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">About</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className="text-center text-xs text-gray-400 py-10">
                                    User activity logs will appear here.
                                </div>
                            )}
                            {activeTab === 'security' && (
                                <div className="text-center text-xs text-gray-400 py-10">
                                    Security settings and login history.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
