'use client';

import { useEffect, useState } from 'react';

const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME || 'alaqd';

export default function SuccessClient({ sessionId }: { sessionId?: string }) {
    const [fallback, setFallback] = useState(false);

    useEffect(() => {
        const deepLink = sessionId
            ? `${APP_SCHEME}://subscription-success?session_id=${encodeURIComponent(sessionId)}`
            : `${APP_SCHEME}://subscription-success`;

        window.location.href = deepLink;

        const t = setTimeout(() => setFallback(true), 1500);
        return () => clearTimeout(t);
    }, [sessionId]);

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#A8893A] text-4xl text-white">
                ✓
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[#6B5B3A]">Bienvenue dans Gold</h1>
            <p className="text-sm text-[#8B7744]">
                Votre abonnement est actif. Retour vers l&apos;application…
            </p>
            {fallback && (
                <p className="mt-6 text-xs text-neutral-500">
                    Pas de retour automatique ? Fermez cet onglet et rouvrez
                    Al-Aqd — votre abonnement est déjà actif.
                </p>
            )}
        </main>
    );
}
