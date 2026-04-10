import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/users/export ────────────────────────────────────────────────

/**
 * GET /api/admin/users/export
 * Export users to CSV
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';

        // Filters (same as list endpoint)
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const gender = searchParams.get('gender');
        const nationality = searchParams.get('nationality');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const subscription = searchParams.get('subscription');
        const includeIncomplete = searchParams.get('includeIncomplete') === 'true';

        // Build query — match the list endpoint default and hide incomplete users
        const query: Record<string, unknown> = {};
        if (!includeIncomplete) query.isOnboarded = true;

        if (role) query.role = role;
        if (status) query.status = status;
        if (gender) query.gender = gender;
        if (nationality) query.nationality = nationality;
        if (subscription) query['subscription.plan'] = subscription;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        const users = await User.find(query)
            .select('name email phoneNumber gender dateOfBirth nationality ethnicity maritalStatus education profession location bio role status subscription createdAt lastActive')
            .lean();

        if (format === 'json') {
            return NextResponse.json({
                success: true,
                users: users.map(u => ({
                    name: u.name,
                    email: u.email,
                    phoneNumber: u.phoneNumber,
                    gender: u.gender,
                    dateOfBirth: u.dateOfBirth,
                    nationality: u.nationality?.join('; '),
                    ethnicity: u.ethnicity?.join('; '),
                    maritalStatus: u.maritalStatus,
                    education: u.education,
                    profession: u.profession,
                    location: u.location,
                    bio: u.bio,
                    role: u.role,
                    status: u.status,
                    subscription: u.subscription?.plan,
                    subscriptionActive: u.subscription?.isActive,
                    createdAt: u.createdAt,
                    lastActive: u.lastActive,
                })),
            });
        }

        // CSV export
        const headers = [
            'Name', 'Email', 'Phone', 'Gender', 'Date of Birth', 'Nationality',
            'Ethnicity', 'Marital Status', 'Education', 'Profession', 'Location',
            'Bio', 'Role', 'Status', 'Subscription', 'Subscription Active',
            'Created At', 'Last Active'
        ];

        const rows = users.map(u => [
            u.name || '',
            u.email || '',
            u.phoneNumber || '',
            u.gender || '',
            u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
            u.nationality?.join('; ') || '',
            u.ethnicity?.join('; ') || '',
            u.maritalStatus || '',
            u.education || '',
            u.profession || '',
            u.location || '',
            (u.bio || '').replace(/"/g, '""'),
            u.role || '',
            u.status || '',
            u.subscription?.plan || 'free',
            u.subscription?.isActive ? 'Yes' : 'No',
            u.createdAt ? new Date(u.createdAt).toISOString() : '',
            u.lastActive ? new Date(u.lastActive).toISOString() : '',
        ].map(field => `"${field}"`).join(','));

        const csv = [headers.join(','), ...rows].join('\n');

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Admin export users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
