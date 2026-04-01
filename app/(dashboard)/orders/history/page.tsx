'use client';

import React, { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Download, ArrowUpRight, ArrowDownLeft, Filter, X, Loader2 } from 'lucide-react';

interface Transaction {
    id: string;
    transactionNumber: string;
    orderId?: { id: string; orderNumber: string };
    userId?: string;
    userName?: string;
    type: 'credit' | 'debit';
    amount: number;
    currency: string;
    description: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    paymentMethod?: string;
    last4?: string;
    provider?: string;
    createdAt: string;
}

interface Stats {
    totalTransactions: number;
    totalCredits: number;
    totalDebits: number;
    completed: number;
    pending: number;
    failed: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function TransactionHistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    // Filter states
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '20');
            if (search) params.set('search', search);
            if (type) params.set('type', type);
            if (status) params.set('status', status);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

            const response = await fetch(`/api/admin/transactions?${params.toString()}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const data = await response.json();

            if (data.success) {
                setTransactions(data.transactions);
                setStats(data.stats);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTransactions(1);
    };

    const handlePageChange = (newPage: number) => {
        fetchTransactions(newPage);
    };

    const clearFilters = () => {
        setSearch('');
        setType('');
        setStatus('');
        setStartDate('');
        setEndDate('');
        fetchTransactions(1);
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (type) params.set('type', type);
            if (status) params.set('status', status);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

            const response = await fetch(`/api/admin/transactions?${params.toString()}&limit=1000`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const data = await response.json();

            if (data.success) {
                const blob = new Blob([JSON.stringify(data.transactions, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transactions-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
            case 'cancelled':
                return 'error';
            default:
                return 'neutral';
        }
    };

    const formatCurrency = (amount: number, currency = 'EUR') => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const hasActiveFilters = search || type || status || startDate || endDate;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Historique des transactions</h1>
                    <p className="text-xs text-gray-500 mt-1">Grand livre financier global de la plateforme.</p>
                </div>
                <Button
                    variant="outline"
                    size="md"
                    className="gap-2 rounded-full"
                    onClick={handleExport}
                >
                    <Download size={16} />
                    <span>Exporter le registre</span>
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total transactions</p>
                        <p className="text-xl font-bold text-gray-900">{stats.totalTransactions}</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total crédits</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalCredits)}</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total débits</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalDebits)}</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Terminées</p>
                        <p className="text-xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">En attente</p>
                        <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Rechercher par numéro de transaction ou description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" variant="primary" size="md" className="rounded-full">
                            Rechercher
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            className="rounded-full gap-2"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            Filtres
                            {hasActiveFilters && (
                                <span className="w-2 h-2 bg-primary rounded-full" />
                            )}
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="md"
                                className="rounded-full gap-1"
                                onClick={clearFilters}
                            >
                                <X size={16} />
                                Effacer
                            </Button>
                        )}
                    </div>
                </form>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select
                            label="Type de transaction"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            options={[
                                { value: '', label: 'Tous les types' },
                                { value: 'credit', label: 'Crédit' },
                                { value: 'debit', label: 'Débit' },
                            ]}
                        />
                        <Select
                            label="Statut"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            options={[
                                { value: '', label: 'Tous les statuts' },
                                { value: 'pending', label: 'En attente' },
                                { value: 'completed', label: 'Terminée' },
                                { value: 'failed', label: 'Échouée' },
                                { value: 'cancelled', label: 'Annulée' },
                            ]}
                        />
                        <Input
                            label="Date de début"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            label="Date de fin"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Transactions Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Aucune transaction trouvée.</p>
                </div>
            ) : (
                <Table
                    data={transactions}
                    keyExtractor={(t) => t.id}
                    columns={[
                        {
                            header: 'Référence',
                            accessor: (t) => (
                                <span className="font-mono text-xs text-gray-500">{t.transactionNumber}</span>
                            ),
                        },
                        {
                            header: 'Type',
                            accessor: (t) => (
                                <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded-full ${t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {t.type === 'credit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                    </div>
                                    <span className="capitalize">{t.type}</span>
                                </div>
                            ),
                        },
                        { header: 'Description', accessor: 'description' },
                        {
                            header: 'Date',
                            accessor: (t) => formatDate(t.createdAt),
                        },
                        {
                            header: 'Montant',
                            accessor: (t) => (
                                <span className={`font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                                </span>
                            ),
                        },
                        {
                            header: 'Statut',
                            accessor: (t) => (
                                <Badge variant={getStatusVariant(t.status)}>{t.status}</Badge>
                            ),
                        },
                        {
                            header: 'Utilisateur',
                            accessor: (t) => t.userName || '-',
                        },
                    ]}
                />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} transactions
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
