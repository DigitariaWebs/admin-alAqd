'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, Shield, MoreHorizontal, Link2, Link2Off, Mail } from 'lucide-react';
import { MOCK_GUARDIAN_RELATIONSHIPS } from '@/config/guardian-data';

export default function GuardiansPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Gestion des Tuteurs / Mahram</h1>
                    <p className="text-xs text-gray-500 mt-1">Supervisez les relations Tuteur-Utilisateur pour assurer la conformité.</p>
                </div>
            </div>

            {/* Filters & Actions */}
            <Card className="flex flex-col gap-4 py-4 px-6 rounded-[25px]">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou code..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="md" className="gap-2 rounded-full flex-1 sm:flex-none justify-center">
                            <Filter size={14} />
                            <span>Filtres</span>
                        </Button>
                        <Button variant="outline" size="md" className="rounded-full flex-1 sm:flex-none justify-center">
                            Exporter
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Relationships Table */}
            <Table
                data={MOCK_GUARDIAN_RELATIONSHIPS}
                keyExtractor={(item) => item.id}
                columns={[
                    {
                        header: 'Utilisatrice',
                        accessor: (item) => (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                    {item.userName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-xs">{item.userName}</p>
                                    <p className="text-[10px] text-gray-500">{item.userEmail}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Tuteur (Mahram)',
                        accessor: (item) => (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                    {(item.guardianName || 'T').charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-xs">{item.guardianName || 'Invité (Sans Nom)'}</p>
                                    <p className="text-[10px] text-gray-500">{item.guardianEmail || 'Partage de Code'}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Code',
                        accessor: (item) => (
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600">
                                {item.accessCode}
                            </code>
                        )
                    },
                    {
                        header: 'Statut',
                        accessor: (item) => (
                            <Badge
                                variant={
                                    item.status === 'Actif' ? 'success' :
                                        item.status === 'En attente' ? 'warning' :
                                            'error'
                                }
                            >
                                {item.status}
                            </Badge>
                        )
                    },
                    {
                        header: 'Depuis le',
                        accessor: (item) => (
                            <span className="text-xs text-gray-500">
                                {new Date(item.linkedAt || item.requestedAt).toLocaleDateString('fr-FR')}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        className: 'text-right',
                        accessor: (item) => (
                            <div className="flex items-center justify-end gap-2">
                                {item.status === 'En attente' && (
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Relancer l'invitation"
                                    >
                                        <Mail size={14} />
                                    </button>
                                )}
                                {item.status === 'Actif' ? (
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Révoquer le lien"
                                        onClick={() => alert(`Révoquer le lien pour ${item.userName}?`)}
                                    >
                                        <Link2Off size={14} />
                                    </button>
                                ) : (
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-not-allowed"
                                        disabled
                                    >
                                        <Link2Off size={14} className="opacity-50" />
                                    </button>
                                )}
                            </div>
                        )
                    }
                ]}
            />
        </div>
    );
}
