import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

// PATCH /api/users/me/photos/primary — move photo at given index to position 0
export async function PATCH(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const body = await request.json();
        const { index } = body as { index: number };

        if (typeof index !== 'number' || index < 0) {
            return NextResponse.json(
                { error: 'Valid photo index is required' },
                { status: 400 }
            );
        }

        const user = await User.findById(authResult.user.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const photos = user.photos ?? [];

        if (index >= photos.length) {
            return NextResponse.json(
                { error: 'Photo index out of range' },
                { status: 400 }
            );
        }

        // Move selected photo to first position
        const [primary] = photos.splice(index, 1);
        photos.unshift(primary);
        user.photos = photos;
        await user.save();

        return NextResponse.json({
            success: true,
            photos: user.photos,
        });
    } catch (error) {
        console.error('Set primary photo error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
