'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    RefreshCw,
    Search,
    Shield,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

interface ReportUser {
    id: string;
    name: string;
    photo?: string;
}

interface AdminReport {
    id: string;
    reporter: ReportUser;
    reported: ReportUser;
    reason: string;
    details?: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
    fake_profile: 'Faux profil',
    inappropriate_content: 'Contenu inapproprié',
    harassment: 'Harcèlement',
    spam: 'Spam',
    underage: 'Mineur',
    other: 'Autre',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    reviewed: 'Examiné',
    resolved: 'Résolu',
};

const STATUS_VARIANTS: Record<string, 'warning' | 'primary' | 'success'> = {
    pending: 'warning',
    reviewed: 'primary',
    resolved: 'success',
};

export default function ReportsPage() {
    const { token } = useAppSelector((state) => state.auth);

    const [reports, setReports] = useState<AdminReport[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, resolved: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [reasonFilter, setReasonFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

    const fetchReports = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
                ...(statusFilter && { status: statusFilter }),
                ...(reasonFilter && { reason: reasonFilter }),
            });
            const res = await fetch(`/api/admin/reports?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setReports(data.reports);
                setTotalPages(data.pagination?.totalPages || 1);
                setStats(data.stats || stats);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token, page, statusFilter, reasonFilter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const updateStatus = async (id: string, status: string) => {
        if (!token) return;
        try {
            await fetch('/api/admin/reports', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id, status }),
            });
            fetchReports();
            setSelectedReport(null);
        } catch (error) {
            console.error('Failed to update report:', error);
        }
    };

    const formatDate = (iso: string) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const columns = [
        {
            header: 'Signalé par',
            accessor: (row: AdminReport) => (
                <div className="flex items-center gap-2">
                    {row.reporter.photo ? (
                        <img src={row.reporter.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {row.reporter.name.charAt(0)}
                        </div>
                    )}
                    <span className="text-sm font-medium">{row.reporter.name}</span>
                </div>
            ),
        },
        {
            header: 'Utilisateur signalé',
            accessor: (row: AdminReport) => (
                <div className="flex items-center gap-2">
                    {row.reported.photo ? (
                        <img src={row.reported.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {row.reported.name.charAt(0)}
                        </div>
                    )}
                    <span className="text-sm font-medium">{row.reported.name}</span>
                </div>
            ),
        },
        {
            header: 'Raison',
            accessor: (row: AdminReport) => (
                <Badge variant="primary">
                    {REASON_LABELS[row.reason] || row.reason}
                </Badge>
            ),
        },
        {
            header: 'Statut',
            accessor: (row: AdminReport) => (
                <Badge variant={STATUS_VARIANTS[row.status] || 'primary'}>
                    {STATUS_LABELS[row.status] || row.status}
                </Badge>
            ),
        },
        {
            header: 'Date',
            accessor: (row: AdminReport) => (
                <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>
            ),
        },
        {
            header: '',
            accessor: (row: AdminReport) => (
                <button
                    onClick={() => setSelectedReport(row)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                >
                    <Eye className="h-4 w-4" />
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Signalements</h1>
                    <p className="text-gray-500 mt-1">Gestion des signalements utilisateurs</p>
                </div>
                <button
                    onClick={fetchReports}
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <Shield className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                </Card>
                <Card className="p-4 text-center">
                    <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-xs text-gray-500">En attente</p>
                </Card>
                <Card className="p-4 text-center">
                    <Eye className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.reviewed}</p>
                    <p className="text-xs text-gray-500">Examinés</p>
                </Card>
                <Card className="p-4 text-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                    <p className="text-xs text-gray-500">Résolus</p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="pending">En attente</option>
                        <option value="reviewed">Examiné</option>
                        <option value="resolved">Résolu</option>
                    </select>
                    <select
                        value={reasonFilter}
                        onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">Toutes les raisons</option>
                        {Object.entries(REASON_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <Table
                    columns={columns}
                    data={reports}
                    keyExtractor={(row) => row.id}
                    isLoading={isLoading}
                />
            </Card>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="Détails du signalement"
            >
                {selectedReport && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Signalé par</p>
                                <div className="flex items-center gap-2">
                                    {selectedReport.reporter.photo ? (
                                        <img src={selectedReport.reporter.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                            {selectedReport.reporter.name.charAt(0)}
                                        </div>
                                    )}
                                    <p className="font-medium">{selectedReport.reporter.name}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Utilisateur signalé</p>
                                <div className="flex items-center gap-2">
                                    {selectedReport.reported.photo ? (
                                        <img src={selectedReport.reported.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                            {selectedReport.reported.name.charAt(0)}
                                        </div>
                                    )}
                                    <p className="font-medium">{selectedReport.reported.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Raison</p>
                                <p className="font-medium">{REASON_LABELS[selectedReport.reason] || selectedReport.reason}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium">{formatDate(selectedReport.createdAt)}</p>
                            </div>
                        </div>

                        {selectedReport.details && (
                            <div className="border-t pt-4">
                                <p className="text-gray-500 text-sm">Détails</p>
                                <p className="text-sm mt-1">{selectedReport.details}</p>
                            </div>
                        )}

                        <div className="border-t pt-4">
                            <p className="text-gray-500 text-sm mb-3">Changer le statut</p>
                            <div className="flex gap-2">
                                {(['pending', 'reviewed', 'resolved'] as const).map((s) => (
                                    <Button
                                        key={s}
                                        size="sm"
                                        variant={selectedReport.status === s ? 'primary' : 'outline'}
                                        onClick={() => updateStatus(selectedReport.id, s)}
                                        className="rounded-full"
                                    >
                                        {STATUS_LABELS[s]}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
