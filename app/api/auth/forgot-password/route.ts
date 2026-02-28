import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'If that email exists, a password reset link has been sent',
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store reset token (add fields to user model if needed)
        // For now, we'll use a simple approach
        user.password = resetTokenHash; // Temporary - in production, add separate fields
        await user.save();

        // TODO: Send email with reset link
        // const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${resetToken}`;
        // await sendEmail({ to: email, subject: 'Password Reset', resetUrl });
        
        console.log(`Password reset token for ${email}: ${resetToken}`);

        return NextResponse.json({
            success: true,
            message: 'If that email exists, a password reset link has been sent',
            // Remove in production
            ...(process.env.NODE_ENV === 'development' && { dev_token: resetToken }),
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
