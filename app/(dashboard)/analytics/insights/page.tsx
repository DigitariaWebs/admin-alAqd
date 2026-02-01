'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Lightbulb, TrendingUp, TrendingDown, Users } from 'lucide-react';

export default function InsightsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">AI Insights</h1>
                <p className="text-xs text-gray-500 mt-1">Automated insights and recommendations.</p>
            </div>

            <div className="space-y-4">
                <Card className="rounded-[25px] border-l-4 border-l-primary p-6 flex gap-4">
                    <div className="p-3 h-fit bg-primary-50 rounded-full text-primary">
                        <Lightbulb size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">Increase in User Registration</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">
                            We noticed a 40% spike in registrations from the Casablanca region this week. Consider running targeted ads or localized content to sustain this momentum.
                        </p>
                        <span className="text-[10px] text-gray-400">Detected 2 hours ago</span>
                    </div>
                </Card>

                <Card className="rounded-[25px] border-l-4 border-l-green-500 p-6 flex gap-4">
                    <div className="p-3 h-fit bg-green-50 rounded-full text-green-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">Revenue Optimization</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">
                            Premium subscription retention is at an all-time high (85%). Upselling the 1-year plan could increase LTV by 20%.
                        </p>
                        <span className="text-[10px] text-gray-400">Detected yesterday</span>
                    </div>
                </Card>

                <Card className="rounded-[25px] border-l-4 border-l-red-500 p-6 flex gap-4">
                    <div className="p-3 h-fit bg-red-50 rounded-full text-red-600">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">High Churn Risk</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">
                            Users who haven't completed their profile within 48 hours are 60% more likely to churn. Suggested action: Send automated email reminders.
                        </p>
                        <span className="text-[10px] text-gray-400">Detected 3 days ago</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
