import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/users/roles ─────────────────────────────────────────────────

/**
 * GET /api/admin/users/roles
 * List available roles
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const roles = [
            {
                value: 'user',
                label: 'User',
                description: 'Regular user with basic access',
                permissions: ['view_profiles', 'like', 'message', 'update_own_profile'],
            },
            {
                value: 'moderator',
                label: 'Moderator',
                description: 'Can manage content and users',
                permissions: [
                    'view_profiles',
                    'like',
                    'message',
                    'update_own_profile',
                    'view_analytics',
                    'manage_content',
                    'manage_users',
                    'view_reports',
                ],
            },
            {
                value: 'admin',
                label: 'Administrator',
                description: 'Full system access',
                permissions: [
                    'view_profiles',
                    'like',
                    'message',
                    'update_own_profile',
                    'view_analytics',
                    'manage_content',
                    'manage_users',
                    'manage_admins',
                    'view_reports',
                    'manage_settings',
                    'manage_subscriptions',
                ],
            },
        ];

        const statuses = [
            { value: 'active', label: 'Active', description: 'User can login and use the platform' },
            { value: 'inactive', label: 'Inactive', description: 'User cannot login but data is preserved' },
            { value: 'suspended', label: 'Suspended', description: 'Temporary suspension, can be reactivated' },
            { value: 'banned', label: 'Banned', description: 'Permanent ban, cannot be reversed' },
        ];

        return NextResponse.json({
            success: true,
            roles,
            statuses,
        });
    } catch (error) {
        console.error('Admin list roles error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
