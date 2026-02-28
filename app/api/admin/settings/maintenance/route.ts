import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Setting } from '@/lib/db/models/Setting';
import { requireRole } from '@/lib/auth/middleware';

// ─── PUT /api/admin/settings/maintenance ──────────────────────────────────────

/**
 * PUT /api/admin/settings/maintenance
 * Toggle maintenance mode
 */
export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        const { maintenanceMode, maintenanceMessage } = body;

        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }

        if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
        if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;

        await settings.save();

        return NextResponse.json({
            success: true,
            message: `Maintenance mode ${settings.maintenanceMode ? 'enabled' : 'disabled'} successfully`,
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
        });
    } catch (error) {
        console.error('Admin toggle maintenance mode error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
