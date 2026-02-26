'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, fetchUserDetail, createUser, deleteUser, updateUserStatus, setFilters, setPage, clearSelectedUser, fetchRoles } from '@/store/slices/usersSlice';
import { usersApi } from '@/lib/api/users';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Collapsible } from '@/components/ui/Collapsible';
import { Textarea } from '@/components/ui/Textarea';
import { Plus, Search, Filter, Eye, Edit, Trash2, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import {
    FAITH_TAGS,
    ETHNICITIES,
    COUNTRIES,
    EDUCATION_LEVELS,
    MARITAL_STATUSES,
    RELIGIOUS_PRACTICES
} from '@/config/user-options';

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
    
    // Modal states
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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

    // Filter MultiSelect state
    const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
    const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
    const [selectedPractices, setSelectedPractices] = useState<string[]>([]);

    // Form State for creating user
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        gender: '',
        dateOfBirth: '',
        nationality: [] as string[],
        ethnicity: [] as string[],
        maritalStatus: '',
        education: '',
        profession: '',
        location: '',
        bio: '',
        interests: [] as string[],
        role: 'user',
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
        dispatch(fetchUserDetail(userId));
        setIsViewModalOpen(true);
    };

    // Handle edit user
    const handleEditUser = (userId: string) => {
        dispatch(fetchUserDetail(userId));
        setIsEditModalOpen(true);
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
            gender: '',
            dateOfBirth: '',
            nationality: [],
            ethnicity: [],
            maritalStatus: '',
            education: '',
            profession: '',
            location: '',
            bio: '',
            interests: [],
            role: 'user',
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
                <Button size="md" className="gap-2 rounded-full" onClick={() => setIsAddUserModalOpen(true)}>
                    <Plus size={16} />
                    <span>Ajouter un utilisateur</span>
                </Button>
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
                                { label: 'Inactif', value: 'inactive' },
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
                                <button 
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    onClick={() => handleEditUser(user.id)}
                                >
                                    <Edit size={14} />
                                </button>
                                <button 
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    onClick={() => handleDeleteUser(user.id)}
                                >
                                    <Trash2 size={14} />
                                </button>
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
                title="Ajouter un nouvel utilisateur"
                maxWidth="4xl"
            >
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                            Informations de base
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Nom complet" placeholder="ex: John Doe" />
                            <Input label="Adresse Email" type="email" placeholder="ex: john@example.com" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Date de naissance" type="date" placeholder="JJ/MM/AAAA" />
                                <Select
                                    label="Genre"
                                    options={[
                                        { label: 'Homme', value: 'male' },
                                        { label: 'Femme', value: 'female' },
                                    ]}
                                />
                            </div>
                            <Select
                                label="État civil"
                                options={MARITAL_STATUSES.map(s => ({
                                    label: s.charAt(0).toUpperCase() + s.slice(1),
                                    value: s
                                }))}
                            />

                            {/* Nationality - MultiSelect */}
                            <div className="md:col-span-2">
                                <MultiSelect
                                    label="Nationalité (Max 2)"
                                    options={COUNTRIES.map(c => ({ label: `${c.emoji} ${c.name}`, value: c.code }))}
                                    value={selectedNationalities}
                                    onChange={setSelectedNationalities}
                                    placeholder="Sélectionner nationalités..."
                                />
                            </div>

                            {/* Ethnicity - MultiSelect */}
                            <div className="md:col-span-2">
                                <MultiSelect
                                    label="Origine (Max 3)"
                                    options={ETHNICITIES.map(e => ({ label: e, value: e }))}
                                    value={selectedEthnicities}
                                    onChange={setSelectedEthnicities}
                                    placeholder="Sélectionner origines..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <MultiSelect
                                    label="Pratiques Religieuses"
                                    options={FAITH_TAGS.map(t => ({
                                        label: t.charAt(0).toUpperCase() + t.slice(1).replace(/([A-Z])/g, ' $1').trim(),
                                        value: t
                                    }))}
                                    value={selectedPractices}
                                    onChange={setSelectedPractices}
                                    placeholder="Sélectionner pratiques..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Religious & Personal */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
                            Religieux & Mode de vie
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select
                                label="Pratique Religieuse"
                                options={RELIGIOUS_PRACTICES.map(p => ({
                                    label: p.charAt(0).toUpperCase() + p.slice(1).replace(/([A-Z])/g, ' $1').trim(),
                                    value: p
                                }))}
                            />

                            <Select
                                label="Fumez-vous ?"
                                options={[
                                    { label: 'Non', value: 'no' },
                                    { label: 'Oui', value: 'yes' },
                                ]}
                            />
                            <Select
                                label="Buvez-vous ?"
                                options={[
                                    { label: 'Non', value: 'no' },
                                    { label: 'Oui', value: 'yes' },
                                ]}
                            />
                            <Select
                                label="Êtes-vous reconverti ?"
                                options={[
                                    { label: 'Non', value: 'no' },
                                    { label: 'Oui', value: 'yes' },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Professional & Location */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
                            Professionnel & Détails
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Profession" placeholder="ex: Ingénieur Logiciel" />
                            <Select
                                label="Études"
                                options={EDUCATION_LEVELS.map(e => ({
                                    label: e.charAt(0).toUpperCase() + e.slice(1),
                                    value: e
                                }))}
                            />
                            <Input label="Ville" placeholder="ex: Paris" />
                        </div>
                        <div className="mt-4">
                            <Textarea label="Bio" placeholder="Parlez-nous de vous..." rows={3} />
                        </div>
                        <div className="mt-4">
                            <Textarea label="Intérêts" placeholder="ex: Lecture, Voyages (séparés par virgule)" rows={2} />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3 justify-end sticky bottom-0 bg-white py-4 border-t border-gray-100 mt-4">
                        <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)} className="rounded-full">Annuler</Button>
                        <Button 
                            className="rounded-full" 
                            onClick={handleCreateUser}
                            disabled={isCreating || !newUser.name}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 size={14} className="animate-spin mr-2" />
                                    Création...
                                </>
                            ) : (
                                "Créer l'utilisateur"
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
                        <div className="flex items-center gap-4 pb-4 border-b">
                            <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-xl">
                                {selectedUser.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                                <p className="text-sm text-gray-500">{selectedUser.email || selectedUser.phoneNumber}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant={selectedUser.status === 'active' ? 'success' : selectedUser.status === 'suspended' ? 'warning' : 'neutral'}>
                                        {getStatusLabel(selectedUser.status)}
                                    </Badge>
                                    <Badge variant="neutral">{getRoleLabel(selectedUser.role)}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Genre</p>
                                <p className="font-medium">{selectedUser.gender === 'male' ? 'Homme' : selectedUser.gender === 'female' ? 'Femme' : '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date de naissance</p>
                                <p className="font-medium">{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString('fr-FR') : '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Nationalité</p>
                                <p className="font-medium">{selectedUser.nationality?.join(', ') || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Profession</p>
                                <p className="font-medium">{selectedUser.profession || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium">{selectedUser.location || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Membre depuis</p>
                                <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>

                        {selectedUser.stats && (
                            <div className="pt-4 border-t">
                                <h4 className="font-medium mb-2">Statistiques</h4>
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
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Utilisateur non trouvé</p>
                )}
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    dispatch(clearSelectedUser());
                }}
                title="Modifier l'utilisateur"
                maxWidth="2xl"
            >
                {isLoadingDetail ? (
                    <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                ) : selectedUser ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Statut"
                                value={selectedUser.status}
                                onChange={(e) => dispatch(updateUserStatus({ id: selectedUser.id, status: e.target.value }))}
                                options={[
                                    { label: 'Actif', value: 'active' },
                                    { label: 'Inactif', value: 'inactive' },
                                    { label: 'Suspendu', value: 'suspended' },
                                ]}
                            />
                            <Select
                                label="Rôle"
                                value={selectedUser.role}
                                onChange={(e) => dispatch(updateUserRole({ id: selectedUser.id, role: e.target.value }))}
                                options={[
                                    { label: 'Utilisateur', value: 'user' },
                                    { label: 'Modérateur', value: 'moderator' },
                                    { label: 'Administrateur', value: 'admin' },
                                ]}
                            />
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button onClick={() => setIsEditModalOpen(false)} className="rounded-full">
                                Fermer
                            </Button>
                        </div>
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
                            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser.name}</strong> ?
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
