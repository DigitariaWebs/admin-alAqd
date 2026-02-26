import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { Swipe } from '@/lib/db/models/Swipe';
import { requireRole } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

// ─── GET /api/admin/users/[id] ────────────────────────────────────────────────

/**
 * GET /api/admin/users/[id]
 * Get user details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        const user = await User.findById(id).select('-password').lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get additional stats for this user
        const [matchCount, messageCount, swipeCount] = await Promise.all([
            Match.countDocuments({ $or: [{ user1Id: id }, { user2Id: id }] }),
            Message.countDocuments({ senderId: id }),
            Swipe.countDocuments({ swiperId: id }),
        ]);

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                nationality: user.nationality,
                ethnicity: user.ethnicity,
                maritalStatus: user.maritalStatus,
                education: user.education,
                profession: user.profession,
                location: user.location,
                bio: user.bio,
                height: user.height,
                religiousPractice: user.religiousPractice,
                faithTags: user.faithTags,
                interests: user.interests,
                personality: user.personality,
                photos: user.photos,
                role: user.role,
                status: user.status,
                subscription: user.subscription,
                isOnboarded: user.isOnboarded,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                provider: user.provider,
                guardian: user.guardian,
                preferences: user.preferences,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastActive: user.lastActive,
                stats: {
                    matchCount,
                    messageCount,
                    swipeCount,
                },
            },
        });
    } catch (error) {
        console.error('Admin get user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── PUT /api/admin/users/[id] ────────────────────────────────────────────────

/**
 * PUT /api/admin/users/[id]
 * Update user
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        const body = await request.json();

        const {
            name,
            email,
            phoneNumber,
            gender,
            dateOfBirth,
            nationality,
            ethnicity,
            maritalStatus,
            education,
            profession,
            location,
            bio,
            height,
            religiousPractice,
            faithTags,
            interests,
            personality,
            preferences,
        } = body;

        const updateData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email?.toLowerCase();
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (gender !== undefined) updateData.gender = gender;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
        if (nationality !== undefined) updateData.nationality = nationality;
        if (ethnicity !== undefined) updateData.ethnicity = ethnicity;
        if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus;
        if (education !== undefined) updateData.education = education;
        if (profession !== undefined) updateData.profession = profession;
        if (location !== undefined) updateData.location = location;
        if (bio !== undefined) updateData.bio = bio;
        if (height !== undefined) updateData.height = height;
        if (religiousPractice !== undefined) updateData.religiousPractice = religiousPractice;
        if (faithTags !== undefined) updateData.faithTags = faithTags;
        if (interests !== undefined) updateData.interests = interests;
        if (personality !== undefined) updateData.personality = personality;
        if (preferences !== undefined) updateData.preferences = preferences;

        updateData.updatedAt = new Date();

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, select: '-password' }
        ).lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                nationality: user.nationality,
                ethnicity: user.ethnicity,
                maritalStatus: user.maritalStatus,
                education: user.education,
                profession: user.profession,
                location: user.location,
                bio: user.bio,
                role: user.role,
                status: user.status,
                subscription: user.subscription,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error('Admin update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── DELETE /api/admin/users/[id] ────────────────────────────────────────────────

/**
 * DELETE /api/admin/users/[id]
 * Delete user
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        // Prevent self-deletion
        if (authResult.user.userId === id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const user = await User.findById(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent deleting other admins
        if (user.role === 'admin') {
            return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 });
        }

        await User.findByIdAndDelete(id);

        // Optionally: Delete related data (matches, messages, swipes, etc.)
        // This would require importing the other models

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Admin delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
