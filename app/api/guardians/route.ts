import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Guardian, generateUniqueCode } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireAuth, requireRole } from '@/lib/auth/middleware';
import { getPhotosForViewer } from '@/lib/privacy/photos';

// ─── Helper Functions ───────────────────────────────────────────────────────

function serializeGuardian(guardian: any) {
    return {
        _id: guardian._id,
        femaleUserId: guardian.femaleUserId,
        maleUserId: guardian.maleUserId,
        guardianName: guardian.guardianName,
        guardianPhone: guardian.guardianPhone,
        accessCode: guardian.accessCode,
        status: guardian.status,
        requestedAt: guardian.requestedAt?.toISOString(),
        linkedAt: guardian.linkedAt?.toISOString(),
        revokedAt: guardian.revokedAt?.toISOString(),
        createdAt: guardian.createdAt?.toISOString(),
        updatedAt: guardian.updatedAt?.toISOString(),
    };
}

async function getFemaleUserDetails(femaleUserId: any) {
  const femaleUser = await User.findById(femaleUserId).select(
    "name photos gender photoBlurEnabled",
  );
  if (!femaleUser) return null;
  return {
    id: femaleUser._id,
    name: femaleUser.name,
    photos: getPhotosForViewer({
      photos: femaleUser.photos || [],
      targetGender: femaleUser.gender,
      blurEnabled: femaleUser.photoBlurEnabled,
      isOwner: false,
    }),
    gender: femaleUser.gender,
  };
}

async function getMaleUserDetails(maleUserId: any) {
  if (!maleUserId) return null;
  const maleUser = await User.findById(maleUserId).select(
    "name photos gender photoBlurEnabled",
  );
  if (!maleUser) return null;
  return {
    id: maleUser._id,
    name: maleUser.name,
    photos: getPhotosForViewer({
      photos: maleUser.photos || [],
      targetGender: maleUser.gender,
      blurEnabled: maleUser.photoBlurEnabled,
      isOwner: false,
    }),
    gender: maleUser.gender,
  };
}

// ─── POST /api/guardians ──────────────────────────────────────────────────

/**
 * POST /api/guardians
 * Create guardian relationship (female user invites guardian)
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { userId, gender } = authResult.user;

        // Only female users can create guardian relationships
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.gender !== 'female') {
            return NextResponse.json(
                { error: 'Only female users can invite guardians' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { guardianName, guardianPhone } = body;

        if (!guardianName || !guardianPhone) {
            return NextResponse.json(
                { error: 'Guardian name and phone number are required' },
                { status: 400 }
            );
        }

        // Check if there's already a pending/active guardian relationship
        const existingGuardian = await Guardian.findOne({
            femaleUserId: userId,
            status: { $in: ['pending', 'active'] },
        });

        if (existingGuardian) {
            return NextResponse.json(
                { error: 'You already have a pending or active guardian relationship' },
                { status: 400 }
            );
        }

        // Create new guardian relationship
        const guardian = new Guardian({
            femaleUserId: userId,
            guardianName,
            guardianPhone,
            accessCode: generateUniqueCode(),
            status: 'pending',
            requestedAt: new Date(),
        });

        await guardian.save();

        return NextResponse.json({
            success: true,
            message: 'Guardian invitation created successfully',
            guardian: serializeGuardian(guardian),
        });
    } catch (error) {
        console.error('Create guardian error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ─── GET /api/guardians ──────────────────────────────────────────────────

/**
 * GET /api/guardians
 * Get current user's guardian relationship (female: her guardian, male: guardian of spouse/sister)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { userId, gender } = authResult.user;

        let guardian: any = null;

        if (gender === 'female') {
            // Female user: get their guardian relationship
            guardian = await Guardian.findOne({
                femaleUserId: userId,
                status: { $in: ['pending', 'active'] },
            }).sort({ createdAt: -1 });
        } else {
            // Male user: get the guardian relationship they're linked to
            guardian = await Guardian.findOne({
                maleUserId: userId,
                status: { $in: ['pending', 'active'] },
            }).sort({ createdAt: -1 });
        }

        if (!guardian) {
            return NextResponse.json({
                success: true,
                guardian: null,
                message: 'No guardian relationship found',
            });
        }

        // Get female user details
        const femaleUser = await getFemaleUserDetails(guardian.femaleUserId);
        
        // Get male user details if linked
        const maleUser = await getMaleUserDetails(guardian.maleUserId);

        return NextResponse.json({
            success: true,
            guardian: serializeGuardian(guardian),
            femaleUser,
            maleUser,
        });
    } catch (error) {
        console.error('Get guardian error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
