'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface ConfigData {
    countries: Array<{ code: string; name: string; emoji: string }>;
    ethnicities: Array<{ value: string; label: string }>;
    educationLevels: Array<{ value: string; label: string }>;
    maritalStatuses: Array<{ value: string; label: string }>;
    religiousPractices: Array<{ value: string; label: string }>;
    faithTags: Array<{ value: string; label: string }>;
    personalityTypes: Array<{ value: string; label: string }>;
    interests: Array<{ value: string; label: string; category: string }>;
}

export default function ConfigPage() {
    const [config, setConfig] = useState<ConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('countries');
    const [searchQuery, setSearchQuery] = useState('');

    const getToken = () => localStorage.getItem('auth_token');

    useEffect(() => {
        fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const res = await fetch('/api/admin/config', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await res.json();
            if (data.success) {
                setConfig(data.config);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            toast.error('Erreur lors du chargement de la configuration');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'countries', label: 'Pays', count: config?.countries.length || 0 },
        { id: 'ethnicities', label: 'Ethnies', count: config?.ethnicities.length || 0 },
        { id: 'education', label: 'Éducation', count: config?.educationLevels.length || 0 },
        { id: 'marital', label: 'Situation matrimoniale', count: config?.maritalStatuses.length || 0 },
        { id: 'religious', label: 'Pratique religieuse', count: config?.religiousPractices.length || 0 },
        { id: 'faith', label: 'Tags de foi', count: config?.faithTags.length || 0 },
        { id: 'personality', label: 'Personnalité', count: config?.personalityTypes.length || 0 },
        { id: 'interests', label: 'Centres d\'intérêt', count: config?.interests.length || 0 },
    ];

    const filterData = <T extends { label?: string; value?: string; name?: string }>(items: T[], nameField: 'label' | 'name' = 'label') => {
        if (!searchQuery) return items;
        return items.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const fieldValue = nameField === 'label' ? item.label : item.name;
            return (
                (fieldValue?.toLowerCase() || '').includes(searchLower) ||
                (item.value?.toLowerCase() || '').includes(searchLower)
            );
        });
    };

    const renderContent = () => {
        if (!config) return null;

        switch (activeTab) {
            case 'countries':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filterData(config.countries, 'name').map((country: any) => (
                            <div key={country.code} className="flex items-center gap-2 p-3 bg-gray-50 rounded-[15px]">
                                <span className="text-xl">{country.emoji}</span>
                                <span className="text-sm font-medium">{country.name}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'ethnicities':
                return (
                    <div className="flex flex-wrap gap-2">
                        {filterData(config.ethnicities).map((item: any) => (
                            <Badge key={item.value} variant="neutral" className="px-3 py-1">
                                {item.label}
                            </Badge>
                        ))}
                    </div>
                );
            case 'education':
                return (
                    <div className="flex flex-wrap gap-2">
                        {filterData(config.educationLevels).map((item: any) => (
                            <Badge key={item.value} variant="info" className="px-3 py-1">
                                {item.label}
                            </Badge>
                        ))}
                    </div>
                );
            case 'marital':
                return (
                    <div className="flex flex-wrap gap-2">
                        {filterData(config.maritalStatuses).map((item: any) => (
                            <Badge key={item.value} variant="warning" className="px-3 py-1">
                                {item.label}
                            </Badge>
                        ))}
                    </div>
                );
            case 'religious':
                return (
                    <div className="flex flex-wrap gap-2">
                        {filterData(config.religiousPractices).map((item: any) => (
                            <Badge key={item.value} variant="success" className="px-3 py-1">
                                {item.label}
                            </Badge>
                        ))}
                    </div>
                );
            case 'faith':
                return (
                    <div className="flex flex-wrap gap-2">
                        {filterData(config.faithTags).map((item: any) => (
                            <Badge key={item.value} variant="neutral" className="px-3 py-1">
                                {item.label}
                            </Badge>
                        ))}
                    </div>
                );
            case 'personality':
                return (
                    <div className="flex flex-wrap gap-2">
                        {filterData(config.personalityTypes).map((item: any) => (
                            <Badge 
                                key={item.value} 
                                variant={item.value.length === 4 && /^[a-z]{4}$/i.test(item.value) ? 'info' : 'neutral'} 
                                className="px-3 py-1"
                            >
                                {item.label}
                            </Badge>
                        ))}
                    </div>
                );
            case 'interests':
                const groupedInterests = config.interests.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                }, {} as Record<string, any[]>);

                return (
                    <div className="space-y-4">
                        {Object.entries(groupedInterests).map(([category, items]) => (
                            <div key={category}>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2 capitalize">{category}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {filterData(items).map((item: any) => (
                                        <Badge key={item.value} variant="success" className="px-3 py-1">
                                            {item.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Données de configuration</h1>
                    <p className="text-xs text-gray-500 mt-1">Consultez et gérez les options de configuration de l&apos;application.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : config ? (
                    <>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {tab.label}
                                    <span className="ml-2 opacity-70">({tab.count})</span>
                                </button>
                            ))}
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <Card className="rounded-[30px] p-6">
                            {renderContent()}
                        </Card>
                    </>
                ) : (
                    <Card className="rounded-[30px] p-6">
                        <p className="text-gray-500">Aucune donnée de configuration disponible</p>
                    </Card>
                )}
            </div>
        </>
    );
}
