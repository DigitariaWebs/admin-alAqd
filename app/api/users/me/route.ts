import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { Swipe } from '@/lib/db/models/Swipe';
import { Reaction } from '@/lib/db/models/Reaction';
import { Block } from '@/lib/db/models/Block';
import { Favorite } from '@/lib/db/models/Favorite';
import { Report } from '@/lib/db/models/Report';
import { RefreshToken } from '@/lib/db/models/RefreshToken';
import { Notification } from '@/lib/db/models/Notification';
import { Order } from '@/lib/db/models/Order';
import { Transaction } from '@/lib/db/models/Transaction';
import { Ticket } from '@/lib/db/models/Ticket';
import { OTP } from '@/lib/db/models/OTP';
import { deleteFile } from '@/lib/cloudinary';
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
          smoking,
          children,
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
        if (smoking !== undefined) updateData.smoking = smoking;
        if (children !== undefined) updateData.children = children;
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

        const user = await User.findById(authResult.user.userId).select('photos phoneNumber');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = user._id;
        const userIdString = user._id.toString();
        const matchIds = (await Match.find({ $or: [{ user1: userId }, { user2: userId }] }).select('_id'))
            .map((match) => match._id);

        // Best-effort media cleanup. Account deletion should not fail on remote media issues.
        const cloudinaryPublicIds = (user.photos ?? [])
            .map((photoUrl) => extractCloudinaryPublicId(photoUrl))
            .filter((publicId): publicId is string => Boolean(publicId));

        await Promise.all(
            cloudinaryPublicIds.map(async (publicId) => {
                try {
                    await deleteFile(publicId);
                } catch (mediaError) {
                    console.warn('Failed to delete Cloudinary asset during account deletion:', {
                        publicId,
                        mediaError,
                    });
                }
            })
        );

        await Promise.all([
            Swipe.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
            Reaction.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
            Block.deleteMany({ $or: [{ blockerId: userId }, { blockedId: userId }] }),
            Favorite.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
            Report.deleteMany({ $or: [{ reporterId: userId }, { reportedId: userId }] }),
            RefreshToken.deleteMany({ userId }),
            Order.deleteMany({ userId }),
            Transaction.deleteMany({ userId }),
            Ticket.deleteMany({ userId: userIdString }),
            Notification.updateMany(
                { targetUserIds: userIdString },
                { $pull: { targetUserIds: userIdString } }
            ),
            ...(matchIds.length > 0
                ? [Message.deleteMany({ conversationId: { $in: matchIds } })]
                : []),
            Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
        ]);

        await Match.deleteMany({ $or: [{ user1: userId }, { user2: userId }] });

        if (user.phoneNumber) {
            await OTP.deleteMany({ phoneNumber: user.phoneNumber });
        }

        await User.deleteOne({ _id: userId });

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function extractCloudinaryPublicId(url: string): string | null {
    if (!url || !url.includes('/upload/')) {
        return null;
    }

    try {
        const parsedUrl = new URL(url);
        const uploadSegment = '/upload/';
        const uploadIndex = parsedUrl.pathname.indexOf(uploadSegment);

        if (uploadIndex === -1) {
            return null;
        }

        let afterUpload = parsedUrl.pathname.slice(uploadIndex + uploadSegment.length);
        // Strip optional transformation params and version segment (e.g. /w_300,h_300/v123456/...).
        afterUpload = afterUpload.replace(/^(?:[^/]+\/)*v\d+\//, '');

        const dotIndex = afterUpload.lastIndexOf('.');
        const publicId = dotIndex > 0 ? afterUpload.slice(0, dotIndex) : afterUpload;

        return publicId || null;
    } catch {
        return null;
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
      smoking: user.smoking,
      children: user.children,
      interests: user.interests ?? [],
      personality: user.personality ?? [],
      photos: user.photos ?? [],
      photoBlurEnabled: user.photoBlurEnabled !== false,
      unblurredFor: (user.unblurredFor ?? []).map((id: any) => id.toString()),
      callAuthorizedFor: (user.callAuthorizedFor ?? []).map((id: any) =>
        id.toString(),
      ),
      role: user.role,
      status: user.status,
      isOnboarded: user.isOnboarded,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      subscription: user.subscription,
      mahram: user.mahram
        ? {
            email: user.mahram.email,
            phoneNumber: user.mahram.phoneNumber,
            relationship: user.mahram.relationship,
            notifiedAt: user.mahram.notifiedAt,
          }
        : undefined,
      lastActive: user.lastActive,
      createdAt: user.createdAt,
    };
}
