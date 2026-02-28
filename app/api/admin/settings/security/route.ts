import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Setting } from '@/lib/db/models/Setting';
import { requireRole } from '@/lib/auth/middleware';

// ─── PUT /api/admin/settings/security ─────────────────────────────────────────

/**
 * PUT /api/admin/settings/security
 * Update security settings
 */
export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        const { require2FA, passwordExpiryDays, loginAttemptsLimit, sessionTimeoutMinutes } = body;

        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }

        if (require2FA !== undefined) settings.require2FA = require2FA;
        if (passwordExpiryDays !== undefined) settings.passwordExpiryDays = passwordExpiryDays;
        if (loginAttemptsLimit !== undefined) settings.loginAttemptsLimit = loginAttemptsLimit;
        if (sessionTimeoutMinutes !== undefined) settings.sessionTimeoutMinutes = sessionTimeoutMinutes;

        await settings.save();

        return NextResponse.json({
            success: true,
            message: 'Security settings updated successfully',
            settings: {
                require2FA: settings.require2FA,
                passwordExpiryDays: settings.passwordExpiryDays,
                loginAttemptsLimit: settings.loginAttemptsLimit,
                sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
            },
        });
    } catch (error) {
        console.error('Admin update security settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
