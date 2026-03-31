'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import {
    Search,
    Shield,
    Mail,
    RefreshCw,
    Users,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

interface MahramUser {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    mahram: {
        email: string;
        relationship: string;
        notifiedAt: string;
    };
    createdAt: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
    father: 'Père',
    brother: 'Frère',
    paternalUncle: 'Oncle paternel',
    maternalUncle: 'Oncle maternel',
    grandfather: 'Grand-père',
    son: 'Fils',
    muslimFriend: 'Amie musulmane',
    sisterInIslam: 'Soeur en Islam',
    communityRepresentative: 'Représentant communautaire',
    other: 'Autre',
};

export default function MahramPage() {
    const { token } = useAppSelector((state) => state.auth);

    const [users, setUsers] = useState<MahramUser[]>([]);
    const [stats, setStats] = useState({ total: 0, father: 0, brother: 0, uncle: 0, grandfather: 0, other: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [relationshipFilter, setRelationshipFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchMahrams = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
                ...(searchTerm && { search: searchTerm }),
                ...(relationshipFilter && { relationship: relationshipFilter }),
            });
            const res = await fetch(`/api/admin/mahrams?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
                setTotalPages(data.pagination?.totalPages || 1);
                setStats(data.stats || stats);
            }
        } catch (error) {
            console.error('Failed to fetch mahrams:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token, page, searchTerm, relationshipFilter]);

    useEffect(() => {
        fetchMahrams();
    }, [fetchMahrams]);

    const formatDate = (iso: string) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const columns = [
        {
            header: 'Utilisatrice',
            accessor: (row: MahramUser) => (
                <div>
                    <div className="font-medium text-gray-900">{row.name}</div>
                    <div className="text-sm text-gray-500">{row.email}</div>
                </div>
            ),
        },
        {
            header: 'Email Mahram',
            accessor: (row: MahramUser) => (
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{row.mahram.email}</span>
                </div>
            ),
        },
        {
            header: 'Relation',
            accessor: (row: MahramUser) => (
                <Badge variant="primary">
                    {RELATIONSHIP_LABELS[row.mahram.relationship] || row.mahram.relationship}
                </Badge>
            ),
        },
        {
            header: 'Notifié le',
            accessor: (row: MahramUser) => (
                <span className="text-sm text-gray-600">
                    {formatDate(row.mahram.notifiedAt)}
                </span>
            ),
        },
        {
            header: 'Inscription',
            accessor: (row: MahramUser) => (
                <span className="text-sm text-gray-600">
                    {formatDate(row.createdAt)}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mahram / Tuteurs</h1>
                    <p className="text-gray-500 mt-1">Gestion des mahrams déclarés par les utilisatrices</p>
                </div>
                <button
                    onClick={fetchMahrams}
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-4 text-center">
                    <Users className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                </Card>
                {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
                    <Card key={key} className="p-4 text-center">
                        <Shield className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold">{(stats as any)[key] || 0}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={relationshipFilter}
                        onChange={(e) => { setRelationshipFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">Toutes les relations</option>
                        {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <Table
                    columns={columns}
                    data={users}
                    keyExtractor={(row) => row.id}
                    isLoading={isLoading}
                />
            </Card>
        </div>
    );
}
