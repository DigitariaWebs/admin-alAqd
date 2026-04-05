import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES = {
    distance: 500,
    ageRange: { min: 18, max: 60 },
    religiousPractice: [] as string[],
    ethnicity: [] as string[],
    education: [] as string[],
    children: '',
};

function withDefaults(prefs: any) {
    return {
        distance:          prefs?.distance          ?? DEFAULT_PREFERENCES.distance,
        ageRange: {
            min: prefs?.ageRange?.min ?? DEFAULT_PREFERENCES.ageRange.min,
            max: prefs?.ageRange?.max ?? DEFAULT_PREFERENCES.ageRange.max,
        },
        religiousPractice: prefs?.religiousPractice ?? DEFAULT_PREFERENCES.religiousPractice,
        ethnicity:         prefs?.ethnicity         ?? DEFAULT_PREFERENCES.ethnicity,
        education:         prefs?.education         ?? DEFAULT_PREFERENCES.education,
        children:          prefs?.children          ?? DEFAULT_PREFERENCES.children,
    };
}

// ─── GET /api/users/me/preferences ───────────────────────────────────────────

/**
 * Returns the current user's discovery preferences, filling in defaults for
 * any field not yet set.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const user = await User.findById(authResult.user.userId).select('preferences').lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            preferences: withDefaults(user.preferences),
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── PATCH /api/users/me/preferences ─────────────────────────────────────────

/**
 * Update one or more preference fields.
 *
 * Body (all fields optional):
 * {
 *   distance?:          number          (1-500 km)
 *   ageRange?:          { min: number, max: number }
 *   religiousPractice?: string[]
 *   ethnicity?:         string[]
 *   education?:         string[]
 *   children?:          string
 * }
 */
export async function PATCH(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const {
            distance, ageRange,
            religiousPractice, ethnicity, education,
            children,
        } = body;

        const update: Record<string, unknown> = {};

        if (distance !== undefined) {
            const d = Number(distance);
            if (isNaN(d) || d < 1 || d > 500) {
                return NextResponse.json({ error: 'distance must be 1–500 km' }, { status: 400 });
            }
            update['preferences.distance'] = d;
        }

        if (ageRange !== undefined) {
            const min = Number(ageRange.min);
            const max = Number(ageRange.max);
            if (isNaN(min) || isNaN(max) || min < 18 || max > 70 || min > max) {
                return NextResponse.json({ error: 'ageRange.min must be ≥18, max ≤70, min ≤ max' }, { status: 400 });
            }
            update['preferences.ageRange'] = { min, max };
        }

        if (religiousPractice !== undefined) {
            if (!Array.isArray(religiousPractice)) {
                return NextResponse.json({ error: 'religiousPractice must be an array' }, { status: 400 });
            }
            update['preferences.religiousPractice'] = religiousPractice;
        }

        if (ethnicity !== undefined) {
            if (!Array.isArray(ethnicity)) {
                return NextResponse.json({ error: 'ethnicity must be an array' }, { status: 400 });
            }
            update['preferences.ethnicity'] = ethnicity;
        }

        if (education !== undefined) {
            if (!Array.isArray(education)) {
                return NextResponse.json({ error: 'education must be an array' }, { status: 400 });
            }
            update['preferences.education'] = education;
        }

        if (children !== undefined) update['preferences.children'] = children;

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(
            authResult.user.userId,
            { $set: update },
            { new: true, select: 'preferences' }
        ).lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            preferences: withDefaults(user.preferences),
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── DELETE /api/users/me/preferences ────────────────────────────────────────

/**
 * Reset all preferences to their default values.
 */
export async function DELETE(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await User.findByIdAndUpdate(
            authResult.user.userId,
            { $unset: { preferences: '' } }
        );

        return NextResponse.json({
            success: true,
            preferences: withDefaults(null),
        });
    } catch (error) {
        console.error('Reset preferences error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
