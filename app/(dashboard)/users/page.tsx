'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, fetchUserDetail, createUser, deleteUser, updateUserStatus, updateUserRole, setFilters, setPage, clearSelectedUser, fetchRoles } from '@/store/slices/usersSlice';
import { usersApi } from '@/lib/api/users';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Collapsible } from '@/components/ui/Collapsible';
import { Plus, Search, Filter, Eye, Trash2, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import { COUNTRIES } from '@/config/user-options';

// Helper to translate status to French
const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        active: 'Actif',
        inactive: 'Inactif',
        suspended: 'Suspendu',
        banned: 'Banni',
    };
    return labels[status] || status;
};

// Helper to translate role to French
const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
        user: 'Utilisateur',
        admin: 'Administrateur',
        moderator: 'Modérateur',
    };
    return labels[role] || role;
};

export default function UsersPage() {
    const dispatch = useAppDispatch();
    const { list, selectedUser, roles, isLoading, isLoadingDetail, isCreating, error } = useAppSelector(state => state.users);
    const currentUser = useAppSelector(state => state.auth.user);
    const isAdmin = currentUser?.role === 'admin';
    
    // Modal states
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Edit state for view modal
    const [editStatus, setEditStatus] = useState('');
    const [editRole, setEditRole] = useState('');

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFiltersLocal] = useState({
        role: '',
        status: '',
        gender: '',
        nationality: '',
        minAge: '',
        maxAge: '',
        startDate: '',
        endDate: '',
    });

    // Form State for creating admin
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'admin',
        status: 'active',
    });

    // Load data on mount
    useEffect(() => {
        dispatch(fetchUsers(list.filters));
        dispatch(fetchRoles());
    }, []);

    // Handle search
    const handleSearch = () => {
        dispatch(setFilters({ search: searchQuery || undefined }));
        dispatch(fetchUsers({ ...list.filters, search: searchQuery || undefined }));
    };

    // Handle filter apply
    const handleApplyFilters = () => {
        const newFilters = {
            role: filters.role || undefined,
            status: filters.status || undefined,
            gender: filters.gender || undefined,
            nationality: filters.nationality || undefined,
            minAge: filters.minAge ? parseInt(filters.minAge) : undefined,
            maxAge: filters.maxAge ? parseInt(filters.maxAge) : undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
        };
        dispatch(setFilters(newFilters));
        dispatch(fetchUsers({ ...list.filters, ...newFilters }));
    };

    // Handle reset filters
    const handleResetFilters = () => {
        setFiltersLocal({
            role: '',
            status: '',
            gender: '',
            nationality: '',
            minAge: '',
            maxAge: '',
            startDate: '',
            endDate: '',
        });
        setSearchQuery('');
        dispatch(setFilters({ page: 1 }));
        dispatch(fetchUsers({ ...list.filters, page: 1, role: undefined, status: undefined, gender: undefined, nationality: undefined, minAge: undefined, maxAge: undefined, startDate: undefined, endDate: undefined, search: undefined }));
    };

    // Handle pagination
    const handlePageChange = (newPage: number) => {
        dispatch(setPage(newPage));
        dispatch(fetchUsers({ ...list.filters, page: newPage }));
    };

    // Handle export
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await usersApi.exportUsers(list.filters);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    // Handle view user
    const handleViewUser = (userId: string) => {
        const user = list.users.find(u => u.id === userId);
        if (user) {
            setEditStatus(user.status);
            setEditRole(user.role);
        }
        dispatch(fetchUserDetail(userId));
        setIsViewModalOpen(true);
    };

    // Sync edit state when selectedUser loads
    useEffect(() => {
        if (selectedUser) {
            setEditStatus(selectedUser.status);
            setEditRole(selectedUser.role);
        }
    }, [selectedUser]);

    // Handle save changes
    const handleSaveChanges = async () => {
        if (!selectedUser) return;
        if (editStatus !== selectedUser.status) {
            await dispatch(updateUserStatus({ id: selectedUser.id, status: editStatus }));
        }
        if (editRole !== selectedUser.role) {
            await dispatch(updateUserRole({ id: selectedUser.id, role: editRole }));
        }
        dispatch(fetchUsers(list.filters));
        setIsViewModalOpen(false);
        dispatch(clearSelectedUser());
    };

    // Handle delete user
    const handleDeleteUser = (userId: string) => {
        dispatch(fetchUserDetail(userId));
        setIsDeleteModalOpen(true);
    };

    // Confirm delete
    const confirmDelete = () => {
        if (selectedUser) {
            dispatch(deleteUser(selectedUser.id));
            setIsDeleteModalOpen(false);
        }
    };

    // Handle create user
    const handleCreateUser = () => {
        dispatch(createUser(newUser));
        setIsAddUserModalOpen(false);
        resetForm();
    };

    // Reset form
    const resetForm = () => {
        setNewUser({
            name: '',
            email: '',
            phoneNumber: '',
            password: '',
            role: 'admin',
            status: 'active',
        });
    };

    return (
        <div className="space-y-6">
            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Gestion des utilisateurs</h1>
                    <p className="text-xs text-gray-500 mt-1">Gérez les utilisateurs, rôles et statuts de la plateforme.</p>
                </div>
                {isAdmin && (
                    <Button size="md" className="gap-2 rounded-full" onClick={() => setIsAddUserModalOpen(true)}>
                        <Plus size={16} />
                        <span>Ajouter un admin</span>
                    </Button>
                )}
            </div>

            {/* Filters & Actions */}
            <Card className="flex flex-col gap-4 py-4 px-6 rounded-[25px]">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher des utilisateurs..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant={isFilterExpanded ? 'primary' : 'outline'}
                            size="md"
                            className="gap-2 rounded-full flex-1 sm:flex-none justify-center"
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        >
                            <Filter size={14} />
                            <span>Filtres</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="md" 
                            className="rounded-full flex-1 sm:flex-none justify-center"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            <span className="ml-2">Exporter</span>
                        </Button>
                    </div>
                </div>

                {/* Collapsible Filters */}
                <Collapsible isOpen={isFilterExpanded} className="border-t border-gray-100 pt-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select
                            label="Rôle"
                            value={filters.role}
                            onChange={(e) => setFiltersLocal({ ...filters, role: e.target.value })}
                            options={[
                                { label: 'Tous les rôles', value: '' },
                                { label: 'Utilisateur', value: 'user' },
                                { label: 'Administrateur', value: 'admin' },
                                { label: 'Modérateur', value: 'moderator' },
                            ]}
                        />
                        <Select
                            label="Statut"
                            value={filters.status}
                            onChange={(e) => setFiltersLocal({ ...filters, status: e.target.value })}
                            options={[
                                { label: 'Tous les statuts', value: '' },
                                { label: 'Actif', value: 'active' },
                                { label: 'Suspendu', value: 'suspended' },
                            ]}
                        />
                        <Select
                            label="Genre"
                            value={filters.gender}
                            onChange={(e) => setFiltersLocal({ ...filters, gender: e.target.value })}
                            options={[
                                { label: 'Tous', value: '' },
                                { label: 'Homme', value: 'male' },
                                { label: 'Femme', value: 'female' },
                            ]}
                        />
                        <Select
                            label="Nationalité"
                            value={filters.nationality}
                            onChange={(e) => setFiltersLocal({ ...filters, nationality: e.target.value })}
                            options={[
                                { label: 'Toutes', value: '' },
                                ...COUNTRIES.map(c => ({ label: `${c.emoji} ${c.name}`, value: c.code }))
                            ]}
                        />
                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                            <Input 
                                label="Âge Min" 
                                type="number" 
                                placeholder="18" 
                                value={filters.minAge}
                                onChange={(e) => setFiltersLocal({ ...filters, minAge: e.target.value })}
                            />
                            <Input 
                                label="Âge Max" 
                                type="number" 
                                placeholder="60" 
                                value={filters.maxAge}
                                onChange={(e) => setFiltersLocal({ ...filters, maxAge: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                            <Input 
                                label="Date Début" 
                                type="date" 
                                value={filters.startDate}
                                onChange={(e) => setFiltersLocal({ ...filters, startDate: e.target.value })}
                            />
                            <Input 
                                label="Date Fin" 
                                type="date" 
                                value={filters.endDate}
                                onChange={(e) => setFiltersLocal({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={handleResetFilters} className="rounded-full">Réinitialiser</Button>
                        <Button size="sm" onClick={handleApplyFilters} className="rounded-full">Appliquer Filtres</Button>
                    </div>
                </Collapsible>
            </Card>

            {/* Users Table */}
            <Table
                data={list.users}
                keyExtractor={(user) => user.id}
                isLoading={isLoading}
                columns={[
                    {
                        header: 'Utilisateur',
                        accessor: (user: any) => (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                    {user.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-xs">{user.name}</p>
                                    <p className="text-[10px] text-gray-500">{user.email || user.phoneNumber || '-'}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Rôle',
                        accessor: (user: any) => getRoleLabel(user.role)
                    },
                    {
                        header: 'Statut',
                        accessor: (user: any) => (
                            <Badge
                                variant={
                                    user.status === 'active' ? 'success' :
                                    user.status === 'inactive' ? 'neutral' :
                                    user.status === 'suspended' ? 'warning' : 'error'
                                }
                            >
                                {getStatusLabel(user.status)}
                            </Badge>
                        )
                    },
                    {
                        header: 'Abonnement',
                        accessor: (user: any) => user.subscription?.plan === 'free' ? (
                            <Badge variant="neutral">Gratuit</Badge>
                        ) : (
                            <Badge variant="success">{user.subscription?.plan}</Badge>
                        )
                    },
                    {
                        header: 'Date d\'inscription',
                        accessor: (user: any) => user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'
                    },
                    {
                        header: 'Actions',
                        className: 'text-right',
                        accessor: (user: any) => (
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-full transition-colors"
                                    onClick={() => handleViewUser(user.id)}
                                >
                                    <Eye size={14} />
                                </button>
                                {(isAdmin || user.role === 'user') && (
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        )
                    }
                ]}
            />

            {/* Pagination */}
            {list.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-xs text-gray-500">
                        Affichage de {(list.pagination.page - 1) * list.pagination.limit + 1} à {Math.min(list.pagination.page * list.pagination.limit, list.pagination.total)} sur {list.pagination.total} utilisateurs
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={list.pagination.page === 1}
                            onClick={() => handlePageChange(list.pagination.page - 1)}
                            className="rounded-full px-3"
                        >
                            <ChevronLeft size={14} />
                        </Button>
                        <span className="text-xs text-gray-600">
                            {list.pagination.page} / {list.pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={list.pagination.page >= list.pagination.totalPages}
                            onClick={() => handlePageChange(list.pagination.page + 1)}
                            className="rounded-full px-3"
                        >
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isAddUserModalOpen}
                onClose={() => {
                    setIsAddUserModalOpen(false);
                    resetForm();
                }}
                title="Ajouter un administrateur"
                maxWidth="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nom complet"
                            placeholder="ex: Ahmed Benali"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        />
                        <Input
                            label="Adresse Email"
                            type="email"
                            placeholder="ex: ahmed@example.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                        <Input
                            label="Numéro de téléphone"
                            placeholder="ex: +213555000000"
                            value={newUser.phoneNumber}
                            onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                        />
                        <Input
                            label="Mot de passe"
                            type="password"
                            placeholder="Mot de passe"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                        <Select
                            label="Rôle"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            options={[
                                { label: 'Administrateur', value: 'admin' },
                                { label: 'Modérateur', value: 'moderator' },
                            ]}
                        />
                    </div>

                    <div className="pt-2 flex gap-3 justify-end border-t border-gray-100 mt-4">
                        <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)} className="rounded-full">Annuler</Button>
                        <Button
                            className="rounded-full"
                            onClick={handleCreateUser}
                            disabled={isCreating || !newUser.name || !newUser.email || !newUser.password}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 size={14} className="animate-spin mr-2" />
                                    Création...
                                </>
                            ) : (
                                "Créer l'admin"
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* View User Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    dispatch(clearSelectedUser());
                }}
                title="Détails de l'utilisateur"
                maxWidth="2xl"
            >
                {isLoadingDetail ? (
                    <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                ) : selectedUser ? (
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center gap-4 pb-4 border-b">
                            {selectedUser.photos?.[0] ? (
                                <img src={selectedUser.photos[0]} alt={selectedUser.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-white" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-xl">
                                    {selectedUser.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                                <p className="text-sm text-gray-500">{selectedUser.email || '-'}</p>
                                {selectedUser.phoneNumber && (
                                    <p className="text-sm text-gray-500">{selectedUser.phoneNumber}</p>
                                )}
                            </div>
                        </div>

                        {selectedUser.role === 'admin' || selectedUser.role === 'moderator' ? (
                            /* ───── ADMIN / MODERATOR VIEW ───── */
                            <>
                                {isAdmin ? (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Gestion du compte</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Select
                                                label="Rôle"
                                                value={editRole}
                                                onChange={(e) => setEditRole(e.target.value)}
                                                options={[
                                                    { label: 'Administrateur', value: 'admin' },
                                                    { label: 'Modérateur', value: 'moderator' },
                                                ]}
                                            />
                                            <Select
                                                label="Statut"
                                                value={editStatus}
                                                onChange={(e) => setEditStatus(e.target.value)}
                                                options={[
                                                    { label: 'Actif', value: 'active' },
                                                    { label: 'Suspendu', value: 'suspended' },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Compte</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500">Rôle</p>
                                                <p className="font-medium">{getRoleLabel(selectedUser.role)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Statut</p>
                                                <p className="font-medium">{getStatusLabel(selectedUser.status)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Informations</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Membre depuis</p>
                                            <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Dernière activité</p>
                                            <p className="font-medium">{selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString('fr-FR') : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Fournisseur</p>
                                            <p className="font-medium capitalize">{selectedUser.provider || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Email vérifié</p>
                                            <p className="font-medium">{selectedUser.isEmailVerified ? 'Oui' : 'Non'}</p>
                                        </div>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex gap-3 justify-between pt-4 border-t">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => {
                                                setIsViewModalOpen(false);
                                                handleDeleteUser(selectedUser.id);
                                            }}
                                        >
                                            <Trash2 size={14} className="mr-1" /> Supprimer
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="rounded-full"
                                            onClick={handleSaveChanges}
                                            disabled={editStatus === selectedUser.status && editRole === selectedUser.role}
                                        >
                                            Enregistrer
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* ───── REGULAR USER VIEW ───── */
                            <>
                                {/* Manage */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Gestion</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Statut"
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                            options={[
                                                { label: 'Actif', value: 'active' },
                                                { label: 'Suspendu', value: 'suspended' },
                                            ]}
                                        />
                                    </div>
                                </div>

                                {/* Photos */}
                                {selectedUser.photos && selectedUser.photos.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Photos ({selectedUser.photos.length})</h4>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {selectedUser.photos.map((photo: string, i: number) => (
                                                <img key={i} src={photo} alt={`Photo ${i + 1}`} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                                            ))}
                                        </div>
                                        {selectedUser.photoBlurEnabled && (
                                            <p className="text-xs text-amber-600 mt-1">Flou activé</p>
                                        )}
                                    </div>
                                )}

                                {/* Personal Info */}
                                <div className="border-t pt-4">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Informations personnelles</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Genre</p>
                                            <p className="font-medium">{selectedUser.gender === 'male' ? 'Homme' : selectedUser.gender === 'female' ? 'Femme' : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Date de naissance</p>
                                            <p className="font-medium">{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString('fr-FR') : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">État civil</p>
                                            <p className="font-medium">{selectedUser.maritalStatus || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Taille</p>
                                            <p className="font-medium">{selectedUser.height ? `${selectedUser.height} cm` : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Nationalité</p>
                                            <p className="font-medium">{selectedUser.nationality?.length ? selectedUser.nationality.join(', ') : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Origine</p>
                                            <p className="font-medium">{selectedUser.ethnicity?.length ? selectedUser.ethnicity.join(', ') : '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional & Religion */}
                                <div className="border-t pt-4">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Professionnel & Religion</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Profession</p>
                                            <p className="font-medium">{selectedUser.profession || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Études</p>
                                            <p className="font-medium">{selectedUser.education || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Pratique religieuse</p>
                                            <p className="font-medium">{selectedUser.religiousPractice || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Tabac</p>
                                            <p className="font-medium">{selectedUser.smoking || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Alcool</p>
                                            <p className="font-medium">{selectedUser.drinking || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                {selectedUser.bio && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Bio</h4>
                                        <p className="text-sm text-gray-700">{selectedUser.bio}</p>
                                    </div>
                                )}

                                {/* Interests */}
                                {selectedUser.interests && selectedUser.interests.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Centres d&apos;intérêt</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.interests.map((interest: string, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{interest}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Personality */}
                                {selectedUser.personality && selectedUser.personality.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Personnalité</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.personality.map((trait: string, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">{trait}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Faith Tags */}
                                {selectedUser.faithTags && selectedUser.faithTags.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Foi & Pratiques</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.faithTags.map((tag: string, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Subscription */}
                                <div className="border-t pt-4">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Abonnement</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Plan</p>
                                            <p className="font-medium capitalize">{selectedUser.subscription?.plan || 'free'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Statut</p>
                                            <p className="font-medium">{selectedUser.subscription?.isActive ? 'Actif' : 'Inactif'}</p>
                                        </div>
                                        {selectedUser.subscription?.startDate && (
                                            <div>
                                                <p className="text-gray-500">Début</p>
                                                <p className="font-medium">{new Date(selectedUser.subscription.startDate).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        )}
                                        {selectedUser.subscription?.endDate && (
                                            <div>
                                                <p className="text-gray-500">Fin</p>
                                                <p className="font-medium">{new Date(selectedUser.subscription.endDate).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Account Info */}
                                <div className="border-t pt-4">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Compte</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Membre depuis</p>
                                            <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Dernière activité</p>
                                            <p className="font-medium">{selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString('fr-FR') : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Email vérifié</p>
                                            <p className="font-medium">{selectedUser.isEmailVerified ? 'Oui' : 'Non'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Téléphone vérifié</p>
                                            <p className="font-medium">{selectedUser.isPhoneVerified ? 'Oui' : 'Non'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Fournisseur</p>
                                            <p className="font-medium capitalize">{selectedUser.provider || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mahram */}
                                {selectedUser.mahram?.email && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Mahram</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500">Email</p>
                                                <p className="font-medium">{selectedUser.mahram.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Relation</p>
                                                <p className="font-medium capitalize">{
                                                    ({ father: 'Père', brother: 'Frère', uncle: 'Oncle', grandfather: 'Grand-père', other: 'Autre' } as Record<string, string>)[selectedUser.mahram?.relationship ?? ''] || selectedUser.mahram?.relationship || '-'
                                                }</p>
                                            </div>
                                            {selectedUser.mahram.notifiedAt && (
                                                <div>
                                                    <p className="text-gray-500">Notifié le</p>
                                                    <p className="font-medium">{new Date(selectedUser.mahram.notifiedAt).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Stats */}
                                {selectedUser.stats && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Statistiques</h4>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xl font-bold">{selectedUser.stats.matchCount}</p>
                                                <p className="text-xs text-gray-500">Matches</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xl font-bold">{selectedUser.stats.messageCount}</p>
                                                <p className="text-xs text-gray-500">Messages</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xl font-bold">{selectedUser.stats.swipeCount}</p>
                                                <p className="text-xs text-gray-500">Swipes</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 justify-between pt-4 border-t">
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() => {
                                            setIsViewModalOpen(false);
                                            handleDeleteUser(selectedUser.id);
                                        }}
                                    >
                                        <Trash2 size={14} className="mr-1" /> Supprimer
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="rounded-full"
                                        onClick={handleSaveChanges}
                                        disabled={editStatus === selectedUser.status}
                                    >
                                        Enregistrer
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Utilisateur non trouvé</p>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    dispatch(clearSelectedUser());
                }}
                title="Confirmer la suppression"
                maxWidth="sm"
            >
                {selectedUser ? (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Êtes-vous sûr de vouloir supprimer l&apos;utilisateur <strong>{selectedUser.name}</strong> ?
                            Cette action est irréversible.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-full">
                                Annuler
                            </Button>
                            <Button variant="danger" onClick={confirmDelete} className="rounded-full">
                                Supprimer
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Utilisateur non trouvé</p>
                )}
            </Modal>
        </div>
    );
}
