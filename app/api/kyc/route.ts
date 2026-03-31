import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Verification } from '@/lib/db/models/Verification';
import { requireAuth } from '@/lib/auth/middleware';
import { compareFaces } from '@/lib/kyc/compareFaces';

// ─── GET /api/kyc ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const user = await User.findById(authResult.user.userId).select('kycStatus');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const verification = await Verification.findOne({ userId: authResult.user.userId })
            .sort({ createdAt: -1 })
            .select('status rejectionReason createdAt')
            .lean();

        return NextResponse.json({
            success: true,
            kycStatus: user.kycStatus || 'none',
            verification: verification || null,
        });
    } catch (error) {
        console.error('KYC status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── POST /api/kyc ──────────────────────────────────────────────────────────
// Submit KYC: { selfieUrl, idCardFrontUrl, idCardBackUrl }

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { selfieUrl, idCardFrontUrl, idCardBackUrl } = body;

        if (!selfieUrl || !idCardFrontUrl || !idCardBackUrl) {
            return NextResponse.json({ error: 'selfieUrl, idCardFrontUrl, and idCardBackUrl are required' }, { status: 400 });
        }

        const user = await User.findById(authResult.user.userId).select('name dateOfBirth kycStatus');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.kycStatus === 'verified') {
            return NextResponse.json({ error: 'Already verified' }, { status: 400 });
        }

        const verification = await Verification.create({
            userId: authResult.user.userId,
            selfieUrl,
            idCardFrontUrl,
            idCardBackUrl,
            status: 'processing',
        });

        user.kycStatus = 'pending';
        await user.save();

        // Run face comparison + OCR + name/DOB check (async)
        compareFaces(selfieUrl, idCardFrontUrl, idCardBackUrl, user.name, user.dateOfBirth)
            .then(async (result) => {
                verification.faceDetectedInSelfie = result.faceDetectedInSelfie;
                verification.faceDetectedInId = result.faceDetectedInId;
                verification.faceMatch = result.faceMatch;
                verification.faceScore = result.faceScore;
                verification.nameMatch = result.nameMatch;
                verification.dobMatch = result.dobMatch;
                verification.extractedText = result.extractedText;
                verification.status = result.decision;
                verification.rejectionReason = result.reason;
                await verification.save();

                const userUpdate: Record<string, unknown> = { kycStatus: result.decision };
                if (result.decision === 'rejected') {
                    userUpdate.kycRejectedAt = new Date();
                }
                await User.findByIdAndUpdate(authResult.user.userId, userUpdate);
            })
            .catch(async (err) => {
                console.error('[KYC] Processing error:', err);
                verification.status = 'manual_review';
                verification.rejectionReason = 'Processing error — requires manual review';
                await verification.save();

                await User.findByIdAndUpdate(authResult.user.userId, {
                    kycStatus: 'manual_review',
                });
            });

        return NextResponse.json({
            success: true,
            message: 'Verification submitted, processing...',
            verificationId: verification._id,
            status: 'processing',
        });
    } catch (error) {
        console.error('KYC submit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
