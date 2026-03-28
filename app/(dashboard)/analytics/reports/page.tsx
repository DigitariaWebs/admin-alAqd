'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { generateReport, clearReport } from '@/store/slices/analyticsSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { FileText, Download, Loader2, Filter, RefreshCw, BarChart2, Users, DollarSign, Activity } from 'lucide-react';

const REPORT_TYPES = [
    { value: 'summary',    label: 'Rapport Résumé',    description: 'Aperçu des métriques clés',            icon: BarChart2  },
    { value: 'financial',  label: 'Rapport Financier',  description: 'Données de revenus et abonnements',       icon: DollarSign },
    { value: 'users',      label: 'Rapport Utilisateurs',       description: 'Démographie et détails des utilisateurs',       icon: Users      },
    { value: 'engagement', label: 'Rapport Engagement', description: 'Métriques d\'engagement',             icon: Activity   },
];

/** Trigger a browser file download for the CSV endpoint */
async function downloadCSV(type: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ type, format: 'csv' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch(`/api/analytics/reports?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) throw new Error('Failed to download CSV');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export default function ReportsPage() {
    const dispatch = useAppDispatch();
    const { report, error } = useAppSelector(state => state.analytics);
    const [selectedType, setSelectedType] = useState('summary');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const handleGenerateReport = () => {
        dispatch(generateReport({
            type: selectedType,
            format: 'json',
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        }));
    };

    const handleDownloadCSV = async (type: string = selectedType) => {
        setDownloadError(null);
        setIsDownloading(true);
        try {
            await downloadCSV(type, startDate || undefined, endDate || undefined);
        } catch {
            setDownloadError('CSV download failed. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const currentTypeInfo = REPORT_TYPES.find(t => t.value === report.type);

    return (
        <div className="space-y-6">
            {(error || downloadError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error || downloadError}
                </div>
            )}

            {/* ── Report Generator ─────────────────────────────────────────── */}
            <Card padding="lg" className="rounded-[25px]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Filter size={16} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Générer un rapport personnalisé</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Sélectionnez les paramètres et générez un rapport détaillé</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Type de rapport</label>
                        <Select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            options={REPORT_TYPES}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Date début</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Date fin</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                    <Button onClick={handleGenerateReport} disabled={report.isGenerating} className="gap-2">
                        {report.isGenerating
                            ? <Loader2 className="animate-spin" size={14} />
                            : <FileText size={14} />
                        }
                        {report.isGenerating ? 'Génération...' : 'Générer le rapport'}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => handleDownloadCSV()}
                        disabled={isDownloading || report.isGenerating}
                        className="gap-2"
                    >
                        {isDownloading
                            ? <Loader2 className="animate-spin" size={14} />
                            : <Download size={14} />
                        }
                        Télécharger CSV
                    </Button>

                    {report.data && (
                        <Button
                            variant="ghost"
                            onClick={() => dispatch(clearReport())}
                            className="gap-2 ml-auto text-gray-400 hover:text-gray-600"
                        >
                            <RefreshCw size={14} />
                            Clear
                        </Button>
                    )}
                </div>
            </Card>

            {/* ── Report Preview ───────────────────────────────────────────── */}
            {report.data && !report.isGenerating && (
                <Card padding="lg" className="rounded-[25px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm">Aperçu du rapport</h3>
                            <Badge variant="success">{currentTypeInfo?.label ?? report.type}</Badge>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadCSV(report.type)}
                            disabled={isDownloading}
                            className="gap-2"
                        >
                            <Download size={12} />
                            Exporter CSV
                        </Button>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 overflow-auto max-h-96">
                        <pre className="font-mono text-xs text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
                            {JSON.stringify(report.data, null, 2)}
                        </pre>
                    </div>
                </Card>
            )}

            {/* ── Quick Reports ────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Rapports rapides</h3>
                    <span className="text-xs text-gray-400">Cliquez sur une carte pour générer instantanément</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {REPORT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isGenerated = report.type === type.value && !!report.data;

                        return (
                            <Card
                                key={type.value}
                                padding="none"
                                className={`rounded-[25px] flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                                    isGenerated ? 'ring-2 ring-primary/60' : ''
                                }`}
                                onClick={() => {
                                    setSelectedType(type.value);
                                    dispatch(generateReport({ type: type.value, format: 'json' }));
                                }}
                            >
                                <div className="flex justify-between items-start p-4 pb-3">
                                    <div className="p-2.5 bg-gray-50 rounded-xl">
                                        <Icon size={17} className="text-gray-600" />
                                    </div>
                                    <Badge variant={isGenerated ? 'success' : 'neutral'} size="sm">
                                        {isGenerated ? 'Généré' : 'Prêt'}
                                    </Badge>
                                </div>

                                <div className="px-4 pb-3 flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm">{type.label}</h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{type.description}</p>
                                </div>

                                <div className="px-4 pb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        disabled={isDownloading}
                                        className="gap-2 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadCSV(type.value);
                                        }}
                                    >
                                        <Download size={11} />
                                        Exporter CSV
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
