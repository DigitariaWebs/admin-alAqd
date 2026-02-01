'use client';

import React, { useState } from 'react';
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
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';

import {
    FAITH_TAGS,
    ETHNICITIES,
    COUNTRIES,
    EDUCATION_LEVELS,
    MARITAL_STATUSES,
    RELIGIOUS_PRACTICES
} from '@/config/user-options';

// Mock Data
const MOCK_USERS = [
    { id: 1, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Admin', status: 'Actif', joined: '2023-10-15' },
    { id: 2, name: 'Ahmed Hassan', email: 'ahmed@example.com', role: 'User', status: 'Actif', joined: '2023-11-20' },
    { id: 3, name: 'John Doe', email: 'john@example.com', role: 'User', status: 'Inactif', joined: '2024-01-05' },
    { id: 4, name: 'Maria Garcia', email: 'maria@example.com', role: 'Modérateur', status: 'Actif', joined: '2024-02-12' },
    { id: 5, name: 'Robert Chen', email: 'robert@example.com', role: 'User', status: 'Suspendu', joined: '2024-03-01' },
];

// ... inside the component ...



export default function UsersPage() {
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    // Form State
    const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
    const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
    const [selectedPractices, setSelectedPractices] = useState<string[]>([]);

    const resetForm = () => {
        setSelectedNationalities([]);
        setSelectedEthnicities([]);
        setSelectedPractices([]);
    };

    return (
        <div className="space-y-6">
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
                        <Button variant="outline" size="md" className="rounded-full flex-1 sm:flex-none justify-center">
                            Exporter
                        </Button>
                    </div>
                </div>

                {/* Collapsible Filters */}
                <Collapsible isOpen={isFilterExpanded} className="border-t border-gray-100 pt-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select
                            label="Rôle"
                            options={[
                                { label: 'Tous les rôles', value: '' },
                                { label: 'User', value: 'User' },
                                { label: 'Admin', value: 'Admin' },
                                { label: 'Moderator', value: 'Moderator' },
                            ]}
                        />
                        <Select
                            label="Statut"
                            options={[
                                { label: 'Tous les statuts', value: '' },
                                { label: 'Active', value: 'Active' },
                                { label: 'Inactive', value: 'Inactive' },
                                { label: 'Suspended', value: 'Suspended' },
                            ]}
                        />
                        <Select
                            label="Genre"
                            options={[
                                { label: 'Tous', value: '' },
                                { label: 'Homme', value: 'male' },
                                { label: 'Femme', value: 'female' },
                            ]}
                        />
                        <Select
                            label="Nationalité"
                            options={[
                                { label: 'Toutes', value: '' },
                                ...COUNTRIES.map(c => ({ label: `${c.emoji} ${c.name}`, value: c.code }))
                            ]}
                        />
                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                            <Input label="Âge Min" type="number" placeholder="18" />
                            <Input label="Âge Max" type="number" placeholder="60" />
                        </div>
                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                            <Input label="Date Début" type="date" />
                            <Input label="Date Fin" type="date" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => { }} className="rounded-full">Réinitialiser</Button>
                        <Button size="sm" onClick={() => { }} className="rounded-full">Appliquer Filtres</Button>
                    </div>
                </Collapsible>
            </Card>

            {/* Users Table */}
            <Table
                data={MOCK_USERS}
                keyExtractor={(user) => user.id}
                columns={[
                    {
                        header: 'Utilisateur',
                        accessor: (user) => (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-xs">{user.name}</p>
                                    <p className="text-[10px] text-gray-500">{user.email}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Rôle',
                        accessor: 'role'
                    },
                    {
                        header: 'Statut',
                        accessor: (user) => (
                            <Badge
                                variant={
                                    user.status === 'Actif' ? 'success' :
                                        user.status === 'Inactif' ? 'neutral' : 'error'
                                }
                            >
                                {user.status}
                            </Badge>
                        )
                    },
                    {
                        header: 'Date d\'inscription',
                        accessor: 'joined'
                    },
                    {
                        header: 'Actions',
                        className: 'text-right',
                        accessor: () => (
                            <div className="flex items-center justify-end gap-2">
                                <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-full transition-colors">
                                    <Eye size={14} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                    <Edit size={14} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )
                    }
                ]}
            />

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
                        <Button className="rounded-full" onClick={() => {
                            // Mock add logic
                            setIsAddUserModalOpen(false);
                            resetForm();
                            alert('Utilisateur ajouté avec succès (Simulation)');
                        }}>
                            Créer l'utilisateur
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
