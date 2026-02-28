'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Printer, FileText, CreditCard, User, Loader2, AlertCircle } from 'lucide-react';

interface OrderItem {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    total: number;
}

interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    customerName: string;
    customerEmail: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    payment: {
        method: string;
        last4?: string;
        provider: string;
        stripePaymentIntentId?: string;
        stripeSessionId?: string;
    };
    stripeCustomerId?: string;
    subscriptionId?: string;
    planId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    failedAt?: string;
    refundedAt?: string;
}

export default function OrderDetailsPage() {
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const data = await response.json();
            if (data.success) {
                setOrder(data.order);
                setNewStatus(data.order.status);
            } else {
                setError(data.error || 'Failed to load order');
            }
        } catch (err) {
            setError('Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!order || newStatus === order.status) return;

        setUpdating(true);
        setError(null);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (data.success) {
                setOrder({ ...order, status: data.order.status, paymentStatus: data.order.paymentStatus });
            } else {
                setError(data.error || 'Failed to update status');
            }
        } catch (err) {
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
            case 'cancelled':
            case 'refunded':
                return 'error';
            default:
                return 'neutral';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">{error}</p>
                <Link href="/orders">
                    <Button variant="outline" className="mt-4 rounded-full">
                        Back to Orders
                    </Button>
                </Link>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            Order #{order.orderNumber}
                            <Badge variant={getStatusVariant(order.status)} size="sm">{order.status}</Badge>
                        </h1>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="md" className="rounded-full gap-2">
                        <Printer size={16} />
                        Print Invoice
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-[30px] overflow-hidden p-0">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="font-semibold text-sm text-gray-900">Order Items</h3>
                        </div>
                        <div className="p-6">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="pb-4 font-medium">Item</th>
                                        <th className="pb-4 font-medium text-center">Qty</th>
                                        <th className="pb-4 font-medium text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-4 text-gray-900 font-medium">
                                                {item.name}
                                                {item.description && (
                                                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                                )}
                                            </td>
                                            <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                            <td className="py-4 text-right text-gray-900">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={2} className="pt-6 text-right text-gray-500 text-xs">Subtotal</td>
                                        <td className="pt-6 text-right font-medium text-gray-900">{formatCurrency(order.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="pt-2 text-right text-gray-500 text-xs">Tax</td>
                                        <td className="pt-2 text-right font-medium text-gray-900">{formatCurrency(order.tax)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="pt-4 text-right text-gray-900 font-bold text-lg">Total</td>
                                        <td className="pt-4 text-right font-bold text-primary text-lg">{formatCurrency(order.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    {/* Update Status */}
                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" />
                            Order Status
                        </h3>
                        <div className="space-y-4">
                            <Select
                                label="Change Status"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                options={[
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'failed', label: 'Failed' },
                                    { value: 'cancelled', label: 'Cancelled' },
                                    { value: 'refunded', label: 'Refunded' },
                                ]}
                            />
                            <Button
                                className="w-full rounded-full"
                                onClick={handleStatusUpdate}
                                disabled={updating || newStatus === order.status}
                            >
                                {updating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Status'
                                )}
                            </Button>
                        </div>
                    </Card>

                    {/* Customer Details */}
                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            Customer Details
                        </h3>
                        <div className="space-y-1">
                            <p className="font-medium text-sm text-gray-900">{order.customerName}</p>
                            <p className="text-xs text-blue-500">{order.customerEmail || 'No email'}</p>
                            <p className="text-xs text-gray-400 mt-2">User ID: {order.userId}</p>
                            {order.stripeCustomerId && (
                                <p className="text-xs text-gray-400">Stripe Customer: {order.stripeCustomerId}</p>
                            )}
                        </div>
                    </Card>

                    {/* Payment Information */}
                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard size={16} className="text-gray-400" />
                            Payment Information
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[20px]">
                                <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
                                    Card
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-900">
                                        {order.payment.last4 ? `•••• ${order.payment.last4}` : order.payment.method}
                                    </p>
                                    <p className="text-[10px] text-gray-500">via {order.payment.provider}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Payment Status</span>
                                    <Badge variant={getStatusVariant(order.paymentStatus)} size="sm">
                                        {order.paymentStatus}
                                    </Badge>
                                </div>
                                {order.payment.stripePaymentIntentId && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Payment ID</span>
                                        <span className="font-mono text-gray-400">{order.payment.stripePaymentIntentId.slice(0, 20)}...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Timestamps */}
                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-semibold text-sm text-gray-900 mb-4">Timestamps</h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created</span>
                                <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                            </div>
                            {order.completedAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Completed</span>
                                    <span className="text-green-600">{formatDate(order.completedAt)}</span>
                                </div>
                            )}
                            {order.failedAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Failed</span>
                                    <span className="text-red-600">{formatDate(order.failedAt)}</span>
                                </div>
                            )}
                            {order.refundedAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Refunded</span>
                                    <span className="text-orange-600">{formatDate(order.refundedAt)}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
