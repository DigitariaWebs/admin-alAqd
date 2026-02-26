import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { OnboardingContent } from '@/lib/db/models/OnboardingContent';
import { requireRole } from '@/lib/auth/middleware';
import { ONBOARDING_DATA } from '@/config/onboarding-data';

// ─── GET /api/admin/onboarding ───────────────────────────────────────────────

/**
 * GET /api/admin/onboarding
 * Get onboarding content (all or by type)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const useDefault = searchParams.get('useDefault') === 'true';

        // If useDefault is true, return default config data instead of database
        if (useDefault) {
            const validTypes = ['personality', 'faith', 'interests'];
            const data = type && validTypes.includes(type) 
                ? { [type]: ONBOARDING_DATA[type as keyof typeof ONBOARDING_DATA] } 
                : ONBOARDING_DATA;
            return NextResponse.json({ data, isDefault: true });
        }

        // Build query
        const query: Record<string, unknown> = {};
        if (type) query.type = type;

        const contents = await OnboardingContent.find(query)
            .sort({ order: 1 })
            .lean();

        return NextResponse.json({ data: contents });
    } catch (error) {
        console.error('Error fetching onboarding content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch onboarding content' },
            { status: 500 }
        );
    }
}

// ─── PUT /api/admin/onboarding ───────────────────────────────────────────────

/**
 * PUT /api/admin/onboarding
 * Update onboarding content (full replace or partial)
 */
export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { section, key, type, items, isActive, order } = body;

        if (!key || !type) {
            return NextResponse.json(
                { error: 'Key and type are required' },
                { status: 400 }
            );
        }

        // Check if onboarding content with this key exists
        let content = await OnboardingContent.findOne({ key });

        if (content) {
            // Update existing
            content = await OnboardingContent.findByIdAndUpdate(
                content._id,
                {
                    $set: {
                        ...(section && { section }),
                        type,
                        items: items || content.items,
                        ...(isActive !== undefined && { isActive }),
                        ...(order !== undefined && { order }),
                    },
                },
                { new: true, runValidators: true }
            );
        } else {
            // Create new
            const newContent = new OnboardingContent({
                section: section || key,
                key,
                type,
                items: items || [],
                isActive: isActive !== undefined ? isActive : true,
                order: order || 0,
            });
            content = await newContent.save();
        }

        return NextResponse.json(content);
    } catch (error) {
        console.error('Error updating onboarding content:', error);
        return NextResponse.json(
            { error: 'Failed to update onboarding content' },
            { status: 500 }
        );
    }
}

// ─── POST /api/admin/onboarding/seed ─────────────────────────────────────────

/**
 * POST /api/admin/onboarding/seed
 * Seed onboarding content from config (for initial setup)
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const seededContents = [];

        // Seed personality
        const personalityItems = ONBOARDING_DATA.personality.map((value: string) => ({
            value,
            label: value.replace(/([A-Z])/g, ' $1').trim(),
        }));
        const personalityContent = await OnboardingContent.findOneAndUpdate(
            { key: 'personality' },
            {
                section: 'Personality',
                key: 'personality',
                type: 'personality',
                items: personalityItems,
                isActive: true,
                order: 1,
            },
            { new: true, upsert: true }
        );
        seededContents.push(personalityContent);

        // Seed faith
        const faithItems = ONBOARDING_DATA.faith.map((value: string) => ({
            value,
            label: value.replace(/([A-Z])/g, ' $1').trim(),
        }));
        const faithContent = await OnboardingContent.findOneAndUpdate(
            { key: 'faith' },
            {
                section: 'Faith',
                key: 'faith',
                type: 'faith',
                items: faithItems,
                isActive: true,
                order: 2,
            },
            { new: true, upsert: true }
        );
        seededContents.push(faithContent);

        // Seed interests (by category)
        for (const [category, interests] of Object.entries(ONBOARDING_DATA.interests)) {
            const interestItems = (interests as string[]).map((value: string) => ({
                value,
                label: value.replace(/([A-Z])/g, ' $1').trim(),
                category,
            }));
            const interestContent = await OnboardingContent.findOneAndUpdate(
                { key: `interests_${category}` },
                {
                    section: 'Interests',
                    key: `interests_${category}`,
                    type: 'interests',
                    items: interestItems,
                    isActive: true,
                    order: 3,
                },
                { new: true, upsert: true }
            );
            seededContents.push(interestContent);
        }

        return NextResponse.json({
            message: 'Onboarding content seeded successfully',
            data: seededContents,
        });
    } catch (error) {
        console.error('Error seeding onboarding content:', error);
        return NextResponse.json(
            { error: 'Failed to seed onboarding content' },
            { status: 500 }
        );
    }
}
