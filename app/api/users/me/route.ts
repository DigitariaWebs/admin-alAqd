import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

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

        return NextResponse.json({
            success: true,
            user: serializeUser(user),
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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

        const {
          name,
          dateOfBirth,
          gender,
          profession,
          education,
          nationality,
          location,
          ethnicity,
          height,
          maritalStatus,
          religiousPractice,
          faithTags,
          drinking,
          smoking,
          interests,
          personality,
          photos,
          bio,
          isOnboarded,
          photoBlurEnabled,
        } = body;

        const updateData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
        if (gender !== undefined) updateData.gender = gender;
        if (profession !== undefined) updateData.profession = profession;
        if (education !== undefined) updateData.education = education;
        if (nationality !== undefined) updateData.nationality = nationality;
        if (location !== undefined) updateData.location = location;
        if (ethnicity !== undefined) updateData.ethnicity = ethnicity;
        if (height !== undefined) updateData.height = height;
        if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus;
        if (religiousPractice !== undefined) updateData.religiousPractice = religiousPractice;
        if (faithTags !== undefined) updateData.faithTags = faithTags;
        if (drinking !== undefined) updateData.drinking = drinking;
        if (smoking !== undefined) updateData.smoking = smoking;
        if (interests !== undefined) updateData.interests = interests;
        if (personality !== undefined) updateData.personality = personality;
        if (photos !== undefined) updateData.photos = photos;
        if (photoBlurEnabled !== undefined)
          updateData.photoBlurEnabled = !!photoBlurEnabled;
        if (bio !== undefined) updateData.bio = bio;
        if (isOnboarded !== undefined) updateData.isOnboarded = isOnboarded;

        updateData.lastActive = new Date();

        const user = await User.findByIdAndUpdate(
            authResult.user.userId,
            { $set: updateData },
            { new: true, select: '-password' }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: serializeUser(user),
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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

        const user = await User.findById(authResult.user.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Soft delete — set status to banned and anonymize PII
        user.status = 'banned';
        user.name = 'Deleted User';
        user.phoneNumber = undefined;
        user.email = undefined;
        user.bio = undefined;
        user.photos = [];
        user.isOnboarded = false;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Shared serializer — full profile response shape
export function serializeUser(user: any) {
    return {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      email: user.email,
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
      drinking: user.drinking,
      smoking: user.smoking,
      interests: user.interests ?? [],
      personality: user.personality ?? [],
      photos: user.photos ?? [],
      photoBlurEnabled: user.photoBlurEnabled !== false,
      role: user.role,
      status: user.status,
      isOnboarded: user.isOnboarded,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      subscription: user.subscription,
      lastActive: user.lastActive,
      createdAt: user.createdAt,
    };
}
