import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

const MAX_PHOTOS = 6;

// POST /api/users/me/photos — add one or more photo URIs
export async function POST(request: NextRequest) {
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
        const { uris } = body as { uris: string[] };

        if (!uris || !Array.isArray(uris) || uris.length === 0) {
            return NextResponse.json(
                { error: 'uris array is required' },
                { status: 400 }
            );
        }

        const user = await User.findById(authResult.user.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentPhotos = user.photos ?? [];

        if (currentPhotos.length + uris.length > MAX_PHOTOS) {
            return NextResponse.json(
                { error: `Cannot exceed ${MAX_PHOTOS} photos` },
                { status: 400 }
            );
        }

        user.photos = [...currentPhotos, ...uris];
        await user.save();

        return NextResponse.json({
            success: true,
            photos: user.photos,
        });
    } catch (error) {
        console.error('Add photos error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/users/me/photos?index=0 — remove photo by index
export async function DELETE(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const { searchParams } = new URL(request.url);
        const index = parseInt(searchParams.get('index') ?? '');

        if (isNaN(index) || index < 0) {
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

        photos.splice(index, 1);
        user.photos = photos;
        await user.save();

        return NextResponse.json({
            success: true,
            photos: user.photos,
        });
    } catch (error) {
        console.error('Delete photo error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
