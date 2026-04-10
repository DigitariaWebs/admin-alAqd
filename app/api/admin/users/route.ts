import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';

// ─── GET /api/admin/users ───────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * List users with filters (role, status, gender, nationality, age, date range)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Filters
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const gender = searchParams.get('gender');
        const nationality = searchParams.get('nationality');
        const minAge = searchParams.get('minAge');
        const maxAge = searchParams.get('maxAge');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const subscription = searchParams.get('subscription');
        const includeIncomplete = searchParams.get('includeIncomplete') === 'true';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build query — by default, hide users who haven't completed onboarding
        // (they show up as ghost records with no real data). Set
        // ?includeIncomplete=true to show them anyway.
        const query: Record<string, unknown> = { role: { $ne: 'superadmin' } };
        if (!includeIncomplete) query.isOnboarded = true;

        if (role) query.role = role;
        if (status) query.status = status;
        if (gender) query.gender = gender;
        if (nationality) query.nationality = nationality;
        if (subscription) query['subscription.plan'] = subscription;

        // Age range
        if (minAge || maxAge) {
            query.dateOfBirth = {};
            const now = new Date();
            if (minAge) {
                const maxDOB = new Date(now.getFullYear() - parseInt(minAge), now.getMonth(), now.getDate());
                (query.dateOfBirth as Record<string, Date>).$lte = maxDOB;
            }
            if (maxAge) {
                const minDOB = new Date(now.getFullYear() - parseInt(maxAge) - 1, now.getMonth(), now.getDate());
                (query.dateOfBirth as Record<string, Date>).$gte = minDOB;
            }
        }

        // Date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        // Search (name or email)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
            ];
        }

        // Sort
        const sort: Record<string, 1 | -1> = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        // Calculate stats
        const stats = await User.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                    inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
                    suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
                    premium: { $sum: { $cond: [{ $in: ['$subscription.plan', ['premium', 'gold']] }, 1, 0] } },
                    male: { $sum: { $cond: [{ $eq: ['$gender', 'male'] }, 1, 0] } },
                    female: { $sum: { $cond: [{ $eq: ['$gender', 'female'] }, 1, 0] } },
                },
            },
        ]);

        return NextResponse.json({
            success: true,
            users: users.map(u => ({
                id: u._id.toString(),
                name: u.name,
                email: u.email,
                phoneNumber: u.phoneNumber,
                gender: u.gender,
                dateOfBirth: u.dateOfBirth,
                nationality: u.nationality,
                role: u.role,
                status: u.status,
                subscription: u.subscription,
                isOnboarded: u.isOnboarded,
                createdAt: u.createdAt,
                lastActive: u.lastActive,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: stats[0] || { total: 0, active: 0, inactive: 0, suspended: 0, premium: 0, male: 0, female: 0 },
        });
    } catch (error) {
        console.error('Admin list users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── POST /api/admin/users ───────────────────────────────────────────────────

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        const {
            name,
            email,
            phoneNumber,
            password,
            gender,
            dateOfBirth,
            nationality,
            ethnicity,
            maritalStatus,
            education,
            profession,
            location,
            bio,
            interests,
            role = 'user',
            status = 'active',
        } = body;

        // Validation
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        if (!email && !phoneNumber) {
            return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 });
        }

        // Check for existing user
        if (email) {
            const existingEmail = await User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
            }
        }

        if (phoneNumber) {
            const existingPhone = await User.findOne({ phoneNumber });
            if (existingPhone) {
                return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 });
            }
        }

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 12);
        }

        const user = await User.create({
            name,
            email: email?.toLowerCase(),
            phoneNumber,
            password: hashedPassword,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            nationality: nationality || [],
            ethnicity: ethnicity || [],
            maritalStatus,
            education,
            profession,
            location,
            bio,
            interests: interests || [],
            role,
            status,
            provider: email ? 'email' : 'phone',
            isOnboarded: false,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                gender: user.gender,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Admin create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
