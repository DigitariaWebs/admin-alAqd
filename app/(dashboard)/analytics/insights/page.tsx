'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchInsights } from '@/store/slices/analyticsSlice';
import { Card } from '@/components/ui/Card';
import { Lightbulb, TrendingUp, TrendingDown, Users, Loader2, AlertTriangle, Info, Sparkles } from 'lucide-react';

export default function InsightsPage() {
    const dispatch = useAppDispatch();
    const { insights, isLoading, error } = useAppSelector(state => state.analytics);

    useEffect(() => {
        dispatch(fetchInsights());
    }, [dispatch]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <TrendingUp size={24} />;
            case 'warning':
                return <AlertTriangle size={24} />;
            case 'tip':
                return <Sparkles size={24} />;
            default:
                return <Info size={24} />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'success':
                return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-l-green-500' };
            case 'warning':
                return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-l-red-500' };
            case 'tip':
                return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-l-amber-500' };
            default:
                return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-l-blue-500' };
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high':
                return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">High</span>;
            case 'medium':
                return <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Medium</span>;
            default:
                return <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Low</span>;
        }
    };

    if (isLoading && insights.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {insights.length === 0 ? (
                <Card className="rounded-[25px] p-8 text-center">
                    <Lightbulb className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune analyse disponible</h3>
                    <p className="text-sm text-gray-500">
                        Nous avons besoin de plus de données pour générer des analyses. Revenez plus tard.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {insights.map((insight) => {
                        const colors = getColor(insight.type);
                        return (
                            <Card 
                                key={insight.id} 
                                className={`rounded-[25px] border-l-4 ${colors.border} p-6 flex gap-4`}
                            >
                                <div className={`p-3 h-fit rounded-full ${colors.bg} ${colors.text}`}>
                                    {getIcon(insight.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-gray-900 text-sm">{insight.title}</h3>
                                        {getPriorityBadge(insight.priority)}
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                                        {insight.description}
                                    </p>
                                    {insight.metric && insight.value && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-gray-500">{insight.metric}:</span>
                                            <span className="text-sm font-semibold text-primary">{insight.value}</span>
                                        </div>
                                    )}
                                    {insight.recommendation && (
                                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                                            <p className="text-xs text-gray-600">
                                                <span className="font-semibold">Recommandation : </span>
                                                {insight.recommendation}
                                            </p>
                                        </div>
                                    )}
                                    <span className="text-[10px] text-gray-400 mt-2 inline-block">
                                        Détecté {new Date(insight.detectedAt).toLocaleString()}
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="rounded-[25px] p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-full">
                            <TrendingUp className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Analyses positives</p>
                            <p className="text-lg font-bold text-gray-900">
                                {insights.filter(i => i.type === 'success').length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[25px] p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-full">
                            <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Alertes</p>
                            <p className="text-lg font-bold text-gray-900">
                                {insights.filter(i => i.type === 'warning').length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[25px] p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-full">
                            <Users className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total analyses</p>
                            <p className="text-lg font-bold text-gray-900">
                                {insights.length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
