'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heart, Star, Sparkles, ChevronRight, Activity } from 'lucide-react';

const ATTRIBUTES = [
    {
        id: 'personality',
        name: 'Personality Traits',
        description: 'Manage personality tags like "Adventurous", "Introverted".',
        icon: <Sparkles size={24} />,
        count: 40,
        color: 'bg-indigo-50 text-indigo-600'
    },
    {
        id: 'faith',
        name: 'Faith & Values',
        description: 'Manage religious practices and value tags.',
        icon: <Star size={24} />,
        count: 33,
        color: 'bg-amber-50 text-amber-600'
    },
    {
        id: 'interests',
        name: 'Interests & Hobbies',
        description: 'Manage interest categories and specific tags.',
        icon: <Heart size={24} />,
        count: 35, // Approx sum
        color: 'bg-rose-50 text-rose-600'
    },
    {
        id: 'habits',
        name: 'Living Habits',
        description: 'Manage lifestyle habits (Smoking, Sleeping, etc.).',
        icon: <Activity size={24} />,
        count: 5,
        color: 'bg-emerald-50 text-emerald-600'
    },
];

export default function OnboardingPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Sign-up Metadata</h1>
                <p className="text-xs text-gray-500 mt-1">Manage the options available during user registration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ATTRIBUTES.map((attr) => (
                    <Link href={`/content/onboarding/${attr.id}`} key={attr.id} className="block">
                        <Card className="rounded-[30px] p-6 hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-full ${attr.color}`}>
                                    {attr.icon}
                                </div>
                                <div className="p-2 bg-gray-50 rounded-full">
                                    <ChevronRight size={16} className="text-gray-400" />
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-900 text-lg mb-2">{attr.name}</h3>
                            <p className="text-xs text-gray-500 mb-4 h-8">{attr.description}</p>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                <span className="text-xs font-semibold text-gray-900">{attr.count}</span>
                                <span className="text-[10px] text-gray-400">Active Options</span>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
