import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Al-Aqd Gold',
    robots: { index: false, follow: false },
};

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#FAF8F2] text-[#2A1B0F]">
            {children}
        </div>
    );
}
