'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import  Table  from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Send, Clock, Trash2, BarChart3, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Types
type NotificationType = 'informational' | 'promotional' | 'alert';
type TargetAudience = 'all' | 'premium' | 'inactive';

interface Notification {
    id: string;
    title: string;
    body: string;
    type: NotificationType;
    targetAudience: TargetAudience;
    status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
    isScheduled: boolean;
    scheduledFor?: string;
    sentAt?: string;
    createdAt: string;
    deliveryStats?: {
        totalRecipients: number;
        sent: number;
        delivered: number;
        failed: number;
        opened?: number;
        clicked?: number;
    };
}

interface StatsData {
    overview: {
        totalNotifications: number;
        totalRecipients: number;
        totalSent: number;
        totalDelivered: number;
        totalFailed: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
    };
    statusBreakdown: Record<string, number>;
    typeBreakdown: Array<{ _id: string; count: number }>;
    scheduledPending: number;
    recentTrend: Array<{ date: string; count: number }>;
    userReach: {
        totalUsers: number;
        premiumUsers: number;
        freeUsers: number;
    };
}

export default function NotificationsPage() {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        type: 'informational' as NotificationType,
        targetAudience: 'all' as TargetAudience,
        isScheduled: false,
        scheduledFor: '',
        status: 'draft'
    });

    const getToken = () => localStorage.getItem('auth_token');

    // Charger l'historique et les stats
    useEffect(() => {
        fetchNotifications();
        fetchStats();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const res = await fetch('/api/admin/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            toast.error('Erreur lors du chargement');
        }
    };

    const fetchStats = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch('/api/admin/notifications/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;

        try {
            const token = getToken();
            const res = await fetch(`/api/admin/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Notification deleted');
                fetchNotifications();
                fetchStats();
            }
        } catch (error) {
            toast.error('Error deleting notification');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const adminId = '699357295c60598711641d13';

            const payload: any = {
                title: formData.title,
                body: formData.body,
                type: formData.type,
                targetAudience: formData.targetAudience,
                createdBy: adminId,
            };

            // Si c'est une notification programmée
            if (formData.isScheduled && formData.scheduledFor) {
                payload.isScheduled = true;
                payload.scheduledFor = new Date(formData.scheduledFor).toISOString();
                payload.status = 'scheduled';
            } else {
                payload.status = 'sent';
            }

            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            
            if (data.success) {
                toast.success(formData.isScheduled ? 'Notification scheduled' : 'Notification sent');
                setFormData({ 
                    title: '', 
                    body: '', 
                    type: 'informational',
                    targetAudience: 'all',
                    isScheduled: false,
                    scheduledFor: '',
                    status: 'draft'
                });
                fetchNotifications();
                fetchStats();
            } else {
                toast.error(data.error || 'Error');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Title', accessor: (n: Notification) => n.title },
        { header: 'Audience', accessor: (n: Notification) => n.targetAudience },
        { 
            header: 'Type', 
            accessor: (n: Notification) => (
                <Badge variant="neutral">{n.type}</Badge>
            )
        },
        { 
            header: 'Date', 
            accessor: (n: Notification) => {
                if (n.scheduledFor) return `Scheduled: ${new Date(n.scheduledFor).toLocaleString()}`;
                if (n.sentAt) return new Date(n.sentAt).toLocaleString();
                return '-';
            }
        },
        {
            header: 'Status',
            accessor: (n: Notification) => (
                 <Badge variant={
                     n.status === 'sent' ? 'success' : 
                     n.status === 'scheduled' ? 'warning' : 
                     n.status === 'failed' ? 'error' : 'neutral'
                 }>
                    {n.status}
                </Badge>
            )
        },
        {
            header: 'Actions',
            accessor: (n: Notification) => (
                <div className="flex gap-2">
                    {n.status === 'scheduled' && (
                        <button
                            onClick={() => handleDelete(n.id)}
                            className="text-red-500 hover:text-red-700"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        },
    ];

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-xs text-gray-500 mt-1">Send push notifications and manage alerts.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStats(!showStats)}
                        className="flex items-center gap-2"
                    >
                        <BarChart3 size={16} />
                        {showStats ? 'Hide Stats' : 'Show Stats'}
                    </Button>
                </div>

                {showStats && stats && (
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Delivery Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Total Notifications</p>
                                <p className="text-2xl font-bold">{stats.overview.totalNotifications}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Delivery Rate</p>
                                <p className="text-2xl font-bold">{stats.overview.deliveryRate}%</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Open Rate</p>
                                <p className="text-2xl font-bold">{stats.overview.openRate}%</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Scheduled</p>
                                <p className="text-2xl font-bold">{stats.scheduledPending}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <h4 className="font-semibold mb-2">By Type</h4>
                               {stats.typeBreakdown.map(t => (
    <div key={t._id} className="flex justify-between text-sm">
        <span>{t._id}:</span>
        <span className="font-bold">{t.count}</span>
    </div>
))}
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">User Reach</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total Users:</span>
                                        <span className="font-bold">{stats.userReach.totalUsers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Premium:</span>
                                        <span className="font-bold">{stats.userReach.premiumUsers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Free:</span>
                                        <span className="font-bold">{stats.userReach.freeUsers}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Send Form */}
                    <Card className="rounded-[30px] p-6 space-y-4 h-fit">
                        <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                            <Send size={16} /> Compose Notification
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input 
                                label="Title" 
                                placeholder="Notification Title"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                            />
                            <Textarea 
                                label="Message" 
                                placeholder="Type your message here..." 
                                rows={4}
                                value={formData.body}
                                onChange={(e) => setFormData({...formData, body: e.target.value})}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Target Audience"
                                    value={formData.targetAudience}
                                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value as TargetAudience})}
                                    options={[
                                        { value: 'all', label: 'All Users' },
                                        { value: 'premium', label: 'Premium Users' },
                                        { value: 'inactive', label: 'Inactive Users' }
                                    ]}
                                />
                                <Select
                                    label="Type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value as NotificationType})}
                                    options={[
                                        { value: 'informational', label: 'Informational' },
                                        { value: 'promotional', label: 'Promotional' },
                                        { value: 'alert', label: 'Alert' }
                                    ]}
                                />
                            </div>

                            {/* Schedule Option */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="schedule"
                                    checked={formData.isScheduled}
                                    onChange={(e) => setFormData({...formData, isScheduled: e.target.checked})}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="schedule" className="text-sm text-gray-700 flex items-center gap-1">
                                    <Calendar size={14} /> Schedule for later
                                </label>
                            </div>

                            {formData.isScheduled && (
                                <Input
                                    label="Schedule Date & Time"
                                    type="datetime-local"
                                    value={formData.scheduledFor}
                                    onChange={(e) => setFormData({...formData, scheduledFor: e.target.value})}
                                    required
                                />
                            )}

                            <div className="pt-2">
                                <Button 
                                    type="submit"
                                    fullWidth 
                                    size="md" 
                                    className="rounded-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : formData.isScheduled ? 'Schedule Notification' : 'Send Notification'}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* History */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 pl-2">
                            <Clock size={16} /> Recent History
                        </h3>
                        <Table
                            data={notifications}
                            keyExtractor={(notif) => notif.id}
                            columns={columns}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
