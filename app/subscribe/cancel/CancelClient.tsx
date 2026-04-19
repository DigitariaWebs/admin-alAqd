'use client';

import { useEffect, useState } from 'react';

const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME || 'alaqd';

export default function CancelClient() {
    const [fallback, setFallback] = useState(false);

    useEffect(() => {
        window.location.href = `${APP_SCHEME}://subscription-cancel`;
        const t = setTimeout(() => setFallback(true), 1500);
        return () => clearTimeout(t);
    }, []);

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-[#6B5B3A]">Payment cancelled</h1>
            <p className="text-sm text-[#8B7744]">
                No charge was made. Returning you to the app…
            </p>
            {fallback && (
                <p className="mt-6 text-xs text-neutral-500">
                    You can close this tab and try again from the app.
                </p>
            )}
        </main>
    );
}
