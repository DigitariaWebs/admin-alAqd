import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { FAITH_TAGS, ETHNICITIES, COUNTRIES, EDUCATION_LEVELS, MARITAL_STATUSES, RELIGIOUS_PRACTICES } from '@/config/user-options';
import { ONBOARDING_DATA } from '@/config/onboarding-data';

// ─── GET /api/admin/config ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/config
 * Get all configuration data options
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        // Transform countries to have more details
        const countries = COUNTRIES.map(country => ({
            code: country.code,
            name: country.name,
            emoji: country.emoji,
        }));

        // Transform education levels with labels
        const educationLevels = EDUCATION_LEVELS.map(level => ({
            value: level,
            label: level.charAt(0).toUpperCase() + level.slice(1).replace(/([A-Z])/g, ' $1'),
        }));

        // Transform marital statuses with labels
        const maritalStatuses = MARITAL_STATUSES.map(status => ({
            value: status,
            label: status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, ' $1'),
        }));

        // Transform religious practices with labels
        const religiousPractices = RELIGIOUS_PRACTICES.map(practice => ({
            value: practice,
            label: practice === 'preferNotToSay' ? 'Prefer not to say' : practice.charAt(0).toUpperCase() + practice.slice(1).replace(/([A-Z])/g, ' $1'),
        }));

        // Transform faith tags with formatted labels
        const faithTags = FAITH_TAGS.map(tag => ({
            value: tag,
            label: tag.charAt(0).toUpperCase() + tag.slice(1).replace(/([A-Z])/g, ' $1'),
        }));

        // Personality types
        const personalityTypes = ONBOARDING_DATA.personality.map(type => ({
            value: type,
            label: type === 'enfj' || type === 'enfp' || type === 'entj' || type === 'entp' || 
                   type === 'esfj' || type === 'esfp' || type === 'estj' || type === 'estp' 
                ? type.toUpperCase() 
                : type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1'),
        }));

        // Flatten interests from categories
        const interests = Object.entries(ONBOARDING_DATA.interests).flatMap(([category, items]) =>
            items.map(item => ({
                value: item,
                label: item.charAt(0).toUpperCase() + item.slice(1).replace(/([A-Z])/g, ' $1'),
                category: category,
            }))
        );

        return NextResponse.json({
            success: true,
            config: {
                countries,
                ethnicities: ETHNICITIES.map(e => ({ value: e, label: e })),
                educationLevels,
                maritalStatuses,
                religiousPractices,
                faithTags,
                personalityTypes,
                interests,
            },
        });
    } catch (error) {
        console.error('Admin get config error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
