'use client';

import { useState } from 'react';
import type { PlanId } from '@/lib/subscription/plans';

interface PlanRow {
    id: PlanId;
    name: string;
    durationMonths: number;
    priceLabel: string;
    pricePerMonthLabel: string;
    savingPercent?: number;
    highlight: boolean;
}

interface Props {
    token: string;
    plans: PlanRow[];
    initialPlanId: PlanId;
    firstName?: string;
}

export default function SubscribeClient({ token, plans, initialPlanId, firstName }: Props) {
    const [selectedId, setSelectedId] = useState<PlanId>(initialPlanId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selected = plans.find((p) => p.id === selectedId)!;

    const handleSubscribe = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/subscriptions/web-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, planId: selectedId }),
            });
            const data = await res.json();
            if (!res.ok || !data.checkoutUrl) {
                throw new Error(data.error || 'Failed to start checkout');
            }
            window.location.href = data.checkoutUrl;
        } catch (e: any) {
            setError(e.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
            <header className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#A8893A] text-white text-2xl">
                    ★
                </div>
                {firstName && (
                    <p className="mb-1 text-sm font-medium text-[#A8893A]">
                        Bonjour, {firstName} 👋
                    </p>
                )}
                <h1 className="text-2xl font-bold text-[#6B5B3A]">Al-Aqd Gold</h1>
                <p className="mt-2 text-sm text-[#8B7744]">
                    Profils illimités et une expérience sans publicité.
                </p>
            </header>

            <section className="mb-6 grid grid-cols-3 gap-2">
                {plans.map((p) => {
                    const active = p.id === selectedId;
                    return (
                        <button
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={`relative rounded-xl border-2 px-2 py-4 text-center transition ${
                                active
                                    ? 'border-[#A8893A] bg-[#F5F0E1]'
                                    : 'border-neutral-200 bg-white'
                            }`}
                        >
                            {p.savingPercent ? (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-md bg-[#A8893A] px-2 py-0.5 text-[10px] font-bold text-white">
                                    -{p.savingPercent}%
                                </span>
                            ) : null}
                            <div className="text-[10px] font-bold uppercase tracking-wide text-[#6B5B3A]">
                                {p.durationMonths === 1
                                    ? '1 mois'
                                    : `${p.durationMonths} mois`}
                            </div>
                            <div className="mt-2 text-lg font-bold text-[#2A1B0F]">
                                {p.pricePerMonthLabel}
                            </div>
                            <div className="text-[10px] text-[#8B7744]">/ mois</div>
                        </button>
                    );
                })}
            </section>

            <div className="mb-6 rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-neutral-200">
                <div className="flex items-center justify-between">
                    <span className="text-[#6B5B3A]">Total aujourd&apos;hui</span>
                    <span className="font-bold text-[#2A1B0F]">{selected.priceLabel}</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">
                    Renouvellement automatique · Annulable à tout moment depuis l&apos;appli
                </p>
            </div>

            {error && (
                <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                    {error}
                </p>
            )}

            <button
                onClick={handleSubscribe}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-[#C5A55A] to-[#A8893A] py-4 text-base font-bold text-white shadow-md transition disabled:opacity-60"
            >
                {loading ? 'Ouverture du paiement sécurisé…' : `Payer ${selected.priceLabel}`}
            </button>

            <p className="mt-4 text-center text-[11px] text-neutral-400">
                Paiement sécurisé par Stripe. Vous serez redirigé automatiquement
                vers l&apos;application après le paiement.
            </p>
        </main>
    );
}
