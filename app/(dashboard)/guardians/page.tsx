'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
    Search,
    Shield,
    Link2,
    Link2Off,
    Mail,
    RefreshCw,
    Download,
    Eye,
    Edit,
    Trash2,
} from 'lucide-react';
import { adminGuardianApi, AdminGuardian } from '@/lib/api/guardian';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function GuardiansPage() {
    const dispatch = useAppDispatch();
    const { token } = useAppSelector((state) => state.auth);
    
    const [guardians, setGuardians] = useState<AdminGuardian[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        active: 0,
        revoked: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedGuardian, setSelectedGuardian] = useState<AdminGuardian | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'delete'>('view');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const fetchGuardians = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        try {
            const response = await adminGuardianApi.list(token, {
                page,
                limit: 10,
                status: statusFilter || undefined,
                search: searchTerm || undefined,
            });
            
            setGuardians(response.guardians);
            setStats(response.stats);
            setTotalPages(response.pagination.pages);
        } catch (error) {
            console.error('Error fetching guardians:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token, page, statusFilter, searchTerm]);
    
    useEffect(() => {
        fetchGuardians();
    }, [fetchGuardians]);
    
    const handleStatusChange = async (guardianId: string, newStatus: 'pending' | 'active' | 'revoked') => {
        if (!token) return;

        try {
            await adminGuardianApi.update(token, guardianId, { status: newStatus });
            fetchGuardians();
            setShowModal(false);
        } catch (error) {
            console.error('Error updating guardian:', error);
            setErrorMessage('Échec de la mise à jour du statut du tuteur');
        }
    };

    const handleDeleteClick = (guardianId: string) => {
        setDeleteTargetId(guardianId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!token || !deleteTargetId) return;

        try {
            await adminGuardianApi.delete(token, deleteTargetId);
            fetchGuardians();
            setShowModal(false);
        } catch (error) {
            console.error('Error deleting guardian:', error);
            setErrorMessage('Échec de la suppression de la relation de tutorat');
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        if (!token) return;

        try {
            const blob = await adminGuardianApi.export(token, {
                format,
                status: statusFilter || undefined,
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `guardians-export-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting guardians:', error);
            setErrorMessage('Échec de l\'exportation des tuteurs');
        }
    };
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="success">Actif</Badge>;
            case 'pending':
                return <Badge variant="warning">En attente</Badge>;
            case 'revoked':
                return <Badge variant="error">Révoqué</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center justify-between">
                    {errorMessage}
                    <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Gestion des Tuteurs / Mahram</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Supervisez les relations Tuteur-Utilisateur pour assurer la conformité.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="md" 
                        className="gap-2 rounded-full"
                        onClick={() => fetchGuardians()}
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        <span>Actualiser</span>
                    </Button>
                </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="py-4 px-6 rounded-[20px]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <Shield size={24} className="text-gray-400" />
                    </div>
                </Card>
                <Card className="py-4 px-6 rounded-[20px]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Actifs</p>
                            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                        </div>
                        <Link2 size={24} className="text-green-400" />
                    </div>
                </Card>
                <Card className="py-4 px-6 rounded-[20px]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">En attente</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Mail size={24} className="text-yellow-400" />
                    </div>
                </Card>
                <Card className="py-4 px-6 rounded-[20px]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Révoqués</p>
                            <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
                        </div>
                        <Link2Off size={24} className="text-red-400" />
                    </div>
                </Card>
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
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            className="px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="pending">En attente</option>
                            <option value="active">Actif</option>
                            <option value="revoked">Révoqué</option>
                        </select>
                        <Button 
                            variant="outline" 
                            size="md" 
                            className="rounded-full flex-1 sm:flex-none justify-center gap-2"
                            onClick={() => handleExport('csv')}
                        >
                            <Download size={14} />
                            <span>Exporter</span>
                        </Button>
                    </div>
                </div>
            </Card>
            
            {/* Relationships Table */}
            <Table
                data={guardians}
                keyExtractor={(item) => item._id}
                isLoading={isLoading}
                columns={[
                    {
                        header: 'Utilisatrice',
                        accessor: (item) => (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                    {item.femaleUser?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-xs">
                                        {item.femaleUser?.name || 'Unknown'}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                        {item.femaleUser?.id?.substring(0, 8) || 'N/A'}...
                                    </p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Tuteur (Mahram)',
                        accessor: (item) => (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                    {(item.maleUser?.name || item.guardianName || 'T').charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-xs">
                                        {item.maleUser?.name || item.guardianName || 'Invité (Sans Nom)'}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                        {item.maleUser?.id ? `${item.maleUser.id.substring(0, 8)}...` : item.guardianPhone || 'Code Partagé'}
                                    </p>
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
                        accessor: (item) => getStatusBadge(item.status)
                    },
                    {
                        header: 'Depuis le',
                        accessor: (item) => (
                            <span className="text-xs text-gray-500">
                                {item.linkedAt 
                                    ? new Date(item.linkedAt).toLocaleDateString('fr-FR')
                                    : item.requestedAt 
                                        ? new Date(item.requestedAt).toLocaleDateString('fr-FR')
                                        : 'N/A'
                                }
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        className: 'text-right',
                        accessor: (item) => (
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Voir les détails"
                                    onClick={() => {
                                        setSelectedGuardian(item);
                                        setModalMode('view');
                                        setShowModal(true);
                                    }}
                                >
                                    <Eye size={14} />
                                </button>
                                <button
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                    title="Modifier le statut"
                                    onClick={() => {
                                        setSelectedGuardian(item);
                                        setModalMode('edit');
                                        setShowModal(true);
                                    }}
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Supprimer"
                                    onClick={() => handleDeleteClick(item._id)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )
                    }
                ]}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Précédent
                    </Button>
                    <span className="text-sm text-gray-500">
                        Page {page} sur {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Suivant
                    </Button>
                </div>
            )}
            
            {/* View/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'view' ? 'Détails du Tutorat' : 'Modifier le Statut'}
                maxWidth="md"
            >
                {selectedGuardian && (
                    modalMode === 'view' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Utilisatrice</p>
                                    <p className="font-medium">{selectedGuardian.femaleUser?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Tuteur</p>
                                    <p className="font-medium">
                                        {selectedGuardian.maleUser?.name || selectedGuardian.guardianName || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Téléphone du Tuteur</p>
                                    <p className="font-medium">{selectedGuardian.guardianPhone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Code d'Accès</p>
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                        {selectedGuardian.accessCode}
                                    </code>
                                </div>
                                <div>
                                    <p className="text-gray-500">Statut</p>
                                    <div className="mt-1">{getStatusBadge(selectedGuardian.status)}</div>
                                </div>
                                <div>
                                    <p className="text-gray-500">Demandé le</p>
                                    <p className="font-medium">
                                        {selectedGuardian.requestedAt
                                            ? new Date(selectedGuardian.requestedAt).toLocaleString('fr-FR')
                                            : 'N/A'}
                                    </p>
                                </div>
                                {selectedGuardian.linkedAt && (
                                    <div>
                                        <p className="text-gray-500">Liée le</p>
                                        <p className="font-medium">
                                            {new Date(selectedGuardian.linkedAt).toLocaleString('fr-FR')}
                                        </p>
                                    </div>
                                )}
                                {selectedGuardian.revokedAt && (
                                    <div>
                                        <p className="text-gray-500">Révoqué le</p>
                                        <p className="font-medium">
                                            {new Date(selectedGuardian.revokedAt).toLocaleString('fr-FR')}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 justify-between pt-4 border-t">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => {
                                        setShowModal(false);
                                        handleDeleteClick(selectedGuardian._id);
                                    }}
                                >
                                    <Trash2 size={14} className="mr-1" /> Supprimer
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Modifier le statut de la relation de tutorat pour {selectedGuardian.femaleUser?.name}:
                            </p>
                            <div className="space-y-2">
                                {(['pending', 'active', 'revoked'] as const).map((status) => (
                                    <button
                                        key={status}
                                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                                            selectedGuardian.status === status
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => handleStatusChange(selectedGuardian._id, status)}
                                    >
                                        <span className="font-medium capitalize">{status}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }}
                title="Confirmer la suppression"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Êtes-vous sûr de vouloir supprimer cette relation de tutorat ? Cette action est irréversible.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }} className="rounded-full">
                            Annuler
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} className="rounded-full">
                            Supprimer
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
