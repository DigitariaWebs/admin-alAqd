'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, CreditCard, Loader2, AlertCircle } from 'lucide-react';

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

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    completed: 'Complétée',
    failed: 'Échouée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
    paid: 'Payé',
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                setError(data.error || 'Impossible de charger la commande');
            }
        } catch {
            setError('Impossible de charger la commande');
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
                setError(data.error || 'Échec de la mise à jour');
            }
        } catch {
            setError('Échec de la mise à jour');
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

    const formatCurrency = (amountCents: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amountCents / 100);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
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
                        Retour aux commandes
                    </Button>
                </Link>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        Commande #{order.orderNumber}
                        <Badge variant={getStatusVariant(order.status)} size="sm">
                            {STATUS_LABELS[order.status] || order.status}
                        </Badge>
                    </h1>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Single card layout */}
            <Card>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left — Client + Articles + Total */}
                    <div className="lg:col-span-2">
                        {/* Client */}
                        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-sm">
                                {order.customerName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                                <p className="text-xs text-gray-500">{order.customerEmail || '-'}</p>
                            </div>
                        </div>

                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4">Articles</h3>
                        <div className="space-y-3">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                        {item.description && (
                                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                                        {item.quantity > 1 && (
                                            <p className="text-xs text-gray-400">x{item.quantity}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Sous-total</span>
                                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.tax > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Taxe</span>
                                    <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                                <span className="text-gray-900">Total</span>
                                <span className="text-primary">{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right — Info */}
                    <div className="lg:border-l lg:border-gray-100 lg:pl-6 space-y-6">
                        {/* Paiement */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                <CreditCard size={14} /> Paiement
                            </h3>
                            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl mb-3">
                                <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
                                    Carte
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-900">
                                        {order.payment.last4 ? `•••• ${order.payment.last4}` : order.payment.method}
                                    </p>
                                    <p className="text-[10px] text-gray-500">via {order.payment.provider}</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Statut</span>
                                <Badge variant={getStatusVariant(order.paymentStatus)} size="sm">
                                    {STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
                                </Badge>
                            </div>
                            {order.planId && (
                                <div className="flex justify-between text-xs mt-2">
                                    <span className="text-gray-500">Plan</span>
                                    <span className="text-gray-900 font-medium">{order.planId}</span>
                                </div>
                            )}
                        </div>

                        {/* Historique */}
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Historique</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Créée</span>
                                    <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                                </div>
                                {order.completedAt && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Complétée</span>
                                        <span className="text-green-600">{formatDate(order.completedAt)}</span>
                                    </div>
                                )}
                                {order.failedAt && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Échouée</span>
                                        <span className="text-red-600">{formatDate(order.failedAt)}</span>
                                    </div>
                                )}
                                {order.refundedAt && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Remboursée</span>
                                        <span className="text-orange-600">{formatDate(order.refundedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Statut */}
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Modifier le statut</h3>
                            <div className="space-y-3">
                                <Select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    options={[
                                        { value: 'pending', label: 'En attente' },
                                        { value: 'completed', label: 'Complétée' },
                                        { value: 'failed', label: 'Échouée' },
                                        { value: 'cancelled', label: 'Annulée' },
                                        { value: 'refunded', label: 'Remboursée' },
                                    ]}
                                />
                                <Button
                                    className="w-full rounded-full"
                                    size="sm"
                                    onClick={handleStatusUpdate}
                                    disabled={updating || newStatus === order.status}
                                >
                                    {updating ? (
                                        <><Loader2 size={14} className="animate-spin mr-2" /> Mise à jour...</>
                                    ) : (
                                        'Enregistrer'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
