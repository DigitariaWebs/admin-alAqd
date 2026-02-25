import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

interface CompletionField {
    key: string;
    label: string;
    weight: number;
    completed: boolean;
}

function calculateCompletion(user: any): { percentage: number; fields: CompletionField[] } {
    const fields: CompletionField[] = [
        { key: 'name',              label: 'Name',               weight: 8,  completed: !!user.name && user.name !== 'User' },
        { key: 'dateOfBirth',       label: 'Date of birth',      weight: 6,  completed: !!user.dateOfBirth },
        { key: 'gender',            label: 'Gender',             weight: 6,  completed: !!user.gender },
        { key: 'photos',            label: 'Photos',             weight: 12, completed: (user.photos ?? []).length >= 1 },
        { key: 'bio',               label: 'Bio',                weight: 8,  completed: !!user.bio && user.bio.length >= 10 },
        { key: 'profession',        label: 'Profession',         weight: 6,  completed: !!user.profession },
        { key: 'education',         label: 'Education',          weight: 6,  completed: !!user.education },
        { key: 'nationality',       label: 'Nationality',        weight: 6,  completed: (user.nationality ?? []).length >= 1 },
        { key: 'location',          label: 'Location',           weight: 6,  completed: !!user.location },
        { key: 'ethnicity',         label: 'Ethnicity',          weight: 4,  completed: (user.ethnicity ?? []).length >= 1 },
        { key: 'height',            label: 'Height',             weight: 4,  completed: !!user.height },
        { key: 'maritalStatus',     label: 'Marital status',     weight: 6,  completed: !!user.maritalStatus },
        { key: 'religiousPractice', label: 'Religious practice', weight: 6,  completed: !!user.religiousPractice },
        { key: 'faithTags',         label: 'Faith practices',    weight: 4,  completed: (user.faithTags ?? []).length >= 1 },
        { key: 'interests',         label: 'Interests',          weight: 6,  completed: (user.interests ?? []).length >= 3 },
        { key: 'personality',       label: 'Personality',        weight: 6,  completed: (user.personality ?? []).length >= 1 },
    ];

    const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
    const earnedWeight = fields.filter(f => f.completed).reduce((sum, f) => sum + f.weight, 0);
    const percentage = Math.round((earnedWeight / totalWeight) * 100);

    return { percentage, fields };
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const user = await User.findById(authResult.user.userId).select('-password');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { percentage, fields } = calculateCompletion(user);

        const incomplete = fields
            .filter(f => !f.completed)
            .map(f => ({ key: f.key, label: f.label, weight: f.weight }));

        return NextResponse.json({
            success: true,
            completion: {
                percentage,
                incomplete,
            },
        });
    } catch (error) {
        console.error('Profile completion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
