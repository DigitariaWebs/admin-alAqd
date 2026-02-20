'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getCurrentUser } from '@/store/slices/authSlice';

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
    </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const token = localStorage.getItem('auth_token');

        if (token && !isAuthenticated) {
            dispatch(getCurrentUser());
        } else if (!token && !isLoading) {
            router.push('/login');
        }
    }, [mounted, dispatch, isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (!mounted) return;

        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [mounted, isAuthenticated, isLoading, router]);

    if (!mounted || isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
