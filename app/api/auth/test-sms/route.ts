import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalized = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    await sendSMS(normalized, 'AlAqd test SMS — if you received this, Twilio is working!');

    return NextResponse.json({ success: true, sentTo: normalized });
  } catch (error: any) {
    console.error('Test SMS error:', error?.message, error?.code, error?.status);
    return NextResponse.json(
      { error: error?.message || 'Failed to send SMS', code: error?.code },
      { status: 500 },
    );
  }
}
