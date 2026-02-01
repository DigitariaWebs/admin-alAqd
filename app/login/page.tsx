'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Shield } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Mock login delay
        setTimeout(() => {
            router.push('/');
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md p-8 rounded-[30px] shadow-xl border-0">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Connexion Admin</h1>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                        Accédez au panneau d'administration sécurisé Al-Aqd.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Adresse Email"
                        type="email"
                        placeholder="admin@alaqd.com"
                        required
                    />
                    <Input
                        label="Mot de passe"
                        type="password"
                        placeholder="••••••••"
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full rounded-full h-12 text-base"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400">
                    &copy; 2026 Al-Aqd Platform. Tous droits réservés.
                </div>
            </Card>
        </div>
    );
}
