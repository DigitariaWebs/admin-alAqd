import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { serializeUser } from '@/app/api/users/me/route';
import { getPhotosForViewer } from '@/lib/privacy/photos';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireAuth(request);

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const { id } = await params;

        const user = await User.findById(id).select('-password');

        if (!user || user.status === 'banned') {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isOwnProfile = authResult.user.userId === id;
        const isAdmin = authResult.user.role === 'admin' || authResult.user.role === 'moderator';

        // Admin and own profile get full data
        if (isAdmin || isOwnProfile) {
            return NextResponse.json({ success: true, user: serializeUser(user) });
        }

        // Other users get public profile only
        const visiblePhotos = getPhotosForViewer({
          photos: user.photos ?? [],
          targetGender: user.gender,
          blurEnabled: user.photoBlurEnabled,
          isOwner: false,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                bio: user.bio,
                profession: user.profession,
                location: user.location,
                height: user.height,
                nationality: user.nationality ?? [],
                ethnicity: user.ethnicity ?? [],
                maritalStatus: user.maritalStatus,
                education: user.education,
                religiousPractice: user.religiousPractice,
                faithTags: user.faithTags ?? [],
                interests: user.interests ?? [],
                personality: user.personality ?? [],
                photos: visiblePhotos,
                isOnboarded: user.isOnboarded,
                lastActive: user.lastActive,
            },
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
