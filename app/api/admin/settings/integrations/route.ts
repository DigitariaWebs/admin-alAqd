import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Setting } from '@/lib/db/models/Setting';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/settings/integrations ─────────────────────────────────────

/**
 * GET /api/admin/settings/integrations
 * List integrations status
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

        const integrations = [
            {
                name: 'Stripe Payment',
                description: 'Processing payments',
                enabled: settings.stripeEnabled,
                connected: settings.stripeEnabled && !!settings.stripeApiKey,
                config: {
                    apiKey: settings.stripeApiKey,
                },
            },
            {
                name: 'AWS S3 Storage',
                description: 'File storage bucket',
                enabled: settings.s3Enabled,
                connected: settings.s3Enabled && !!settings.s3AccessKey && !!settings.s3SecretKey && !!settings.s3Bucket,
                config: {
                    accessKey: settings.s3AccessKey,
                    secretKey: settings.s3SecretKey,
                    bucket: settings.s3Bucket,
                    region: settings.s3Region,
                },
            },
            {
                name: 'Google Analytics',
                description: 'Website analytics',
                enabled: settings.googleAnalyticsEnabled,
                connected: settings.googleAnalyticsEnabled && !!settings.googleAnalyticsId,
                config: {
                    trackingId: settings.googleAnalyticsId,
                },
            },
        ];

        return NextResponse.json({
            success: true,
            integrations,
        });
    } catch (error) {
        console.error('Admin list integrations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── PUT /api/admin/settings/integrations ─────────────────────────────────────

/**
 * PUT /api/admin/settings/integrations
 * Update integration config
 */
export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        const { stripeEnabled, stripeApiKey, s3Enabled, s3AccessKey, s3SecretKey, s3Bucket, s3Region, googleAnalyticsEnabled, googleAnalyticsId } = body;

        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }

        if (stripeEnabled !== undefined) settings.stripeEnabled = stripeEnabled;
        if (stripeApiKey !== undefined) settings.stripeApiKey = stripeApiKey;
        if (s3Enabled !== undefined) settings.s3Enabled = s3Enabled;
        if (s3AccessKey !== undefined) settings.s3AccessKey = s3AccessKey;
        if (s3SecretKey !== undefined) settings.s3SecretKey = s3SecretKey;
        if (s3Bucket !== undefined) settings.s3Bucket = s3Bucket;
        if (s3Region !== undefined) settings.s3Region = s3Region;
        if (googleAnalyticsEnabled !== undefined) settings.googleAnalyticsEnabled = googleAnalyticsEnabled;
        if (googleAnalyticsId !== undefined) settings.googleAnalyticsId = googleAnalyticsId;

        await settings.save();

        return NextResponse.json({
            success: true,
            message: 'Integrations settings updated successfully',
            integrations: [
                {
                    name: 'Stripe Payment',
                    description: 'Processing payments',
                    enabled: settings.stripeEnabled,
                    connected: settings.stripeEnabled && !!settings.stripeApiKey,
                    config: {
                        apiKey: settings.stripeApiKey,
                    },
                },
                {
                    name: 'AWS S3 Storage',
                    description: 'File storage bucket',
                    enabled: settings.s3Enabled,
                    connected: settings.s3Enabled && !!settings.s3AccessKey && !!settings.s3SecretKey && !!settings.s3Bucket,
                    config: {
                        accessKey: settings.s3AccessKey,
                        secretKey: settings.s3SecretKey,
                        bucket: settings.s3Bucket,
                        region: settings.s3Region,
                    },
                },
                {
                    name: 'Google Analytics',
                    description: 'Website analytics',
                    enabled: settings.googleAnalyticsEnabled,
                    connected: settings.googleAnalyticsEnabled && !!settings.googleAnalyticsId,
                    config: {
                        trackingId: settings.googleAnalyticsId,
                    },
                },
            ],
        });
    } catch (error) {
        console.error('Admin update integrations settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
