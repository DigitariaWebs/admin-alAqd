'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { ToggleLeft, ToggleRight, Lock, Globe, Database } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Settings {
    platformName: string;
    supportEmail: string;
    defaultLanguage: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    require2FA: boolean;
    passwordExpiryDays: number;
    loginAttemptsLimit: number;
    sessionTimeoutMinutes: number;
    stripeEnabled: boolean;
    stripeApiKey: string;
    s3Enabled: boolean;
    s3AccessKey: string;
    s3SecretKey: string;
    s3Bucket: string;
    s3Region: string;
    googleAnalyticsEnabled: boolean;
    googleAnalyticsId: string;
}

interface Integration {
    name: string;
    description: string;
    enabled: boolean;
    connected: boolean;
    config: any;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<Settings | null>(null);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const tabs = [
        { id: 'general', label: 'Général' },
        { id: 'security', label: 'Sécurité' },
        { id: 'integrations', label: 'Intégrations' },
    ];

    const getToken = () => localStorage.getItem('auth_token');

    useEffect(() => {
        fetchSettings();
        fetchIntegrations();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const response = await fetch('/api/admin/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Erreur lors du chargement des paramètres');
        }
    };

    const fetchIntegrations = async () => {
        try {
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const response = await fetch('/api/admin/settings/integrations', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setIntegrations(data.integrations);
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
            toast.error('Erreur lors du chargement des intégrations');
        }
    };

    const handleGeneralSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setMessage('');

        try {
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    platformName: settings.platformName,
                    supportEmail: settings.supportEmail,
                    defaultLanguage: settings.defaultLanguage,
                    maintenanceMode: settings.maintenanceMode,
                    maintenanceMessage: settings.maintenanceMessage,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(prev => prev ? { ...prev, ...data.settings } : null);
                setMessage(data.message);
                toast.success(data.message);
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving general settings:', error);
            toast.error('Échec de la sauvegarde des paramètres');
        }

        setSaving(false);
    };

    const handleSecuritySettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setMessage('');

        try {
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const response = await fetch('/api/admin/settings/security', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    require2FA: settings.require2FA,
                    passwordExpiryDays: settings.passwordExpiryDays,
                    loginAttemptsLimit: settings.loginAttemptsLimit,
                    sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(prev => prev ? { ...prev, ...data.settings } : null);
                setMessage(data.message);
                toast.success(data.message);
            } else {
                throw new Error('Failed to save security settings');
            }
        } catch (error) {
            console.error('Error saving security settings:', error);
            toast.error('Échec de la sauvegarde des paramètres de sécurité');
        }

        setSaving(false);
    };

    const handleIntegrationsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setMessage('');

        try {
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const response = await fetch('/api/admin/settings/integrations', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    stripeEnabled: settings.stripeEnabled,
                    stripeApiKey: settings.stripeApiKey,
                    s3Enabled: settings.s3Enabled,
                    s3AccessKey: settings.s3AccessKey,
                    s3SecretKey: settings.s3SecretKey,
                    s3Bucket: settings.s3Bucket,
                    s3Region: settings.s3Region,
                    googleAnalyticsEnabled: settings.googleAnalyticsEnabled,
                    googleAnalyticsId: settings.googleAnalyticsId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(prev => prev ? { ...prev, ...data.settings } : null);
                setIntegrations(data.integrations);
                setMessage(data.message);
                toast.success(data.message);
            } else {
                throw new Error('Failed to save integrations settings');
            }
        } catch (error) {
            console.error('Error saving integrations settings:', error);
            toast.error('Échec de la sauvegarde des paramètres d\'intégration');
        }

        setSaving(false);
    };

    const toggleMaintenanceMode = async () => {
        if (!settings) return;

        try {
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const response = await fetch('/api/admin/settings/maintenance', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    maintenanceMode: !settings.maintenanceMode,
                    maintenanceMessage: settings.maintenanceMessage,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(prev => prev ? { ...prev, ...data } : null);
                setMessage(data.message);
                toast.success(data.message);
            } else {
                throw new Error('Failed to toggle maintenance mode');
            }
        } catch (error) {
            console.error('Error toggling maintenance mode:', error);
            toast.error('Échec de la modification du mode maintenance');
        }
    };

    if (!settings) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Paramètres Système</h1>
                    <p className="text-xs text-gray-500 mt-1">Configurez les paramètres globaux de l'application.</p>
                </div>
                <Card className="rounded-[30px] min-h-[500px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading settings...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Paramètres Système</h1>
                    <p className="text-xs text-gray-500 mt-1">Configurez les paramètres globaux de l'application.</p>
                </div>

                <Card className="rounded-[30px] min-h-[500px]">
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                    <div className="p-6 max-w-2xl">
                        {activeTab === 'general' && (
                            <form onSubmit={handleGeneralSettingsSave} className="space-y-6">
                                <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                                    <Globe size={16} /> Informations de la plateforme
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Nom de la plateforme"
                                        value={settings.platformName}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, platformName: e.target.value } : null)}
                                    />
                                    <Input
                                        label="Email de support"
                                        value={settings.supportEmail}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, supportEmail: e.target.value } : null)}
                                    />
                                </div>
                                <Input
                                    label="Langue par défaut"
                                    value={settings.defaultLanguage}
                                    onChange={(e) => setSettings(prev => prev ? { ...prev, defaultLanguage: e.target.value } : null)}
                                />

                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 text-sm mb-4">Mode maintenance</h3>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px]">
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">Activer le mode maintenance</p>
                                            <p className="text-xs text-gray-500">Empêcher les utilisateurs d'accéder à la plateforme.</p>
                                        </div>
                                        {settings.maintenanceMode ? (
                                            <ToggleRight size={32} className="text-primary cursor-pointer" onClick={toggleMaintenanceMode} />
                                        ) : (
                                            <ToggleLeft size={32} className="text-gray-300 cursor-pointer" onClick={toggleMaintenanceMode} />
                                        )}
                                    </div>
                                    {settings.maintenanceMode && (
                                        <Input
                                            label="Message de maintenance"
                                            value={settings.maintenanceMessage}
                                            onChange={(e) => setSettings(prev => prev ? { ...prev, maintenanceMessage: e.target.value } : null)}
                                            className="mt-4"
                                        />
                                    )}
                                </div>

                                {message && (
                                    <div className="pt-4">
                                        <p className="text-xs text-green-600">{message}</p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button type="submit" size="md" className="rounded-full" disabled={saving}>
                                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <form onSubmit={handleSecuritySettingsSave} className="space-y-6">
                                <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                                    <Lock size={16} /> Politiques de sécurité
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px]">
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">Authentification à deux facteurs (2FA)</p>
                                            <p className="text-xs text-gray-500">Exiger la 2FA pour tous les comptes admin.</p>
                                        </div>
                                        {settings.require2FA ? (
                                            <ToggleRight size={32} className="text-primary cursor-pointer" onClick={() => setSettings(prev => prev ? { ...prev, require2FA: false } : null)} />
                                        ) : (
                                            <ToggleLeft size={32} className="text-gray-300 cursor-pointer" onClick={() => setSettings(prev => prev ? { ...prev, require2FA: true } : null)} />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px]">
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">Forcer la réinitialisation du mot de passe</p>
                                            <p className="text-xs text-gray-500">Exiger des mises à jour régulières du mot de passe tous les 90 jours.</p>
                                        </div>
                                        {settings.passwordExpiryDays === 90 ? (
                                            <ToggleRight size={32} className="text-primary cursor-pointer" onClick={() => setSettings(prev => prev ? { ...prev, passwordExpiryDays: 0 } : null)} />
                                        ) : (
                                            <ToggleLeft size={32} className="text-gray-300 cursor-pointer" onClick={() => setSettings(prev => prev ? { ...prev, passwordExpiryDays: 90 } : null)} />
                                        )}
                                    </div>

                                    <Input
                                        label="Limite de tentatives de connexion"
                                        type="number"
                                        value={settings.loginAttemptsLimit}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, loginAttemptsLimit: parseInt(e.target.value) } : null)}
                                        min="1"
                                        max="10"
                                    />

                                    <Input
                                        label="Délai d'expiration de session (minutes)"
                                        type="number"
                                        value={settings.sessionTimeoutMinutes}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, sessionTimeoutMinutes: parseInt(e.target.value) } : null)}
                                        min="15"
                                        max="180"
                                    />
                                </div>

                                {message && (
                                    <div className="pt-4">
                                        <p className="text-xs text-green-600">{message}</p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button type="submit" size="md" className="rounded-full" disabled={saving}>
                                        {saving ? 'Mise à jour...' : 'Mettre à jour la sécurité'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'integrations' && (
                            <form onSubmit={handleIntegrationsSave} className="space-y-6">
                                <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                                    <Database size={16} /> Services externes
                                </h3>

                                {integrations.filter(i => !/(stripe|s3|aws)/i.test(i.name)).map((integration) => (
                                    <Card key={integration.name} className="p-4 rounded-[20px] border border-gray-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{integration.name}</p>
                                                <p className="text-[10px] text-gray-500">{integration.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={integration.connected ? 'success' : 'error'}>
                                                    {integration.connected ? 'Connecté' : 'Déconnecté'}
                                                </Badge>
                                                {integration.enabled ? (
                                                    <ToggleRight size={24} className="text-primary cursor-pointer" onClick={() => setSettings(prev => prev ? { ...prev, [`${integration.name.toLowerCase().replace(/\s+/g, '')}Enabled`]: false } : null)} />
                                                ) : (
                                                    <ToggleLeft size={24} className="text-gray-300 cursor-pointer" onClick={() => setSettings(prev => prev ? { ...prev, [`${integration.name.toLowerCase().replace(/\s+/g, '')}Enabled`]: true } : null)} />
                                                )}
                                            </div>
                                        </div>
                                        {integration.enabled && (
                                            <div className="space-y-3">
                                                {Object.entries(integration.config).map(([key, value]) => (
                                                    <Input
                                                        key={key}
                                                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                                                        value={value as string | number}
                                                        onChange={(e) => setSettings(prev => prev ? { ...prev, [`${integration.name.toLowerCase().replace(/\s+/g, '')}${key.charAt(0).toUpperCase() + key.slice(1)}`]: e.target.value } : null)}
                                                        type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') ? 'password' : 'text'}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </Card>
                                ))}

                                {message && (
                                    <div className="pt-4">
                                        <p className="text-xs text-green-600">{message}</p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button type="submit" size="md" className="rounded-full" disabled={saving}>
                                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>
            </div>
        </>
    );
}
