import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Setting } from '@/lib/db/models/Setting';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/settings ───────────────────────────────────────────────────

/**
 * GET /api/admin/settings
 * Get all system settings
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }

        return NextResponse.json({
            success: true,
            settings: {
                // General settings
                platformName: settings.platformName,
                supportEmail: settings.supportEmail,
                defaultLanguage: settings.defaultLanguage,
                maintenanceMode: settings.maintenanceMode,
                maintenanceMessage: settings.maintenanceMessage,

                // Security settings
                require2FA: settings.require2FA,
                passwordExpiryDays: settings.passwordExpiryDays,
                loginAttemptsLimit: settings.loginAttemptsLimit,
                sessionTimeoutMinutes: settings.sessionTimeoutMinutes,

                // Ads settings
                adsEnabled: settings.adsEnabled,
                freeSwipeLimit: settings.freeSwipeLimit,

                // Integrations settings
                stripeEnabled: settings.stripeEnabled,
                stripeApiKey: settings.stripeApiKey,
                s3Enabled: settings.s3Enabled,
                s3AccessKey: settings.s3AccessKey,
                s3SecretKey: settings.s3SecretKey,
                s3Bucket: settings.s3Bucket,
                s3Region: settings.s3Region,
                googleAnalyticsEnabled: settings.googleAnalyticsEnabled,
                googleAnalyticsId: settings.googleAnalyticsId,
            },
        });
    } catch (error) {
        console.error('Admin get settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── PUT /api/admin/settings/general ───────────────────────────────────────────

/**
 * PUT /api/admin/settings/general
 * Update general settings
 */
export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        const { platformName, supportEmail, defaultLanguage, maintenanceMode, maintenanceMessage } = body;

        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }

        if (platformName !== undefined) settings.platformName = platformName;
        if (supportEmail !== undefined) settings.supportEmail = supportEmail;
        if (defaultLanguage !== undefined) settings.defaultLanguage = defaultLanguage;
        if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
        if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;

        await settings.save();

        return NextResponse.json({
            success: true,
            message: 'General settings updated successfully',
            settings: {
                platformName: settings.platformName,
                supportEmail: settings.supportEmail,
                defaultLanguage: settings.defaultLanguage,
                maintenanceMode: settings.maintenanceMode,
                maintenanceMessage: settings.maintenanceMessage,
            },
        });
    } catch (error) {
        console.error('Admin update general settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
