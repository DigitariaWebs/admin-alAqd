import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { sendNotificationEmail } from '@/lib/email';

const COOLDOWN_MS = 60 * 60 * 1000;

type NotifyPayload = {
  participantId?: string;
  mode?: 'audio' | 'video';
  callId?: string;
  sessionId?: string;
  language?: string;
};

type SupportedLanguage = 'en' | 'fr' | 'ar' | 'es';

const MAHRAM_GREETING: Record<SupportedLanguage, string> = {
  en: 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh,',
  fr: 'Assalamou Alaykoum wa Rahmatoullahi wa Barakatouh,',
  ar: 'السلام عليكم ورحمة الله وبركاته،',
  es: 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh,',
};

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeLanguage(value?: string): SupportedLanguage {
  if (value === 'fr' || value === 'ar' || value === 'es') return value;
  return 'en';
}

function getModeLabel(mode: 'audio' | 'video' | undefined, lang: SupportedLanguage): string {
  if (lang === 'fr') {
    if (mode === 'audio') return 'audio';
    if (mode === 'video') return 'video';
    return 'audio/video';
  }

  if (lang === 'ar') {
    if (mode === 'audio') return 'صوتية';
    if (mode === 'video') return 'فيديو';
    return 'صوتية/فيديو';
  }

  if (lang === 'es') {
    if (mode === 'audio') return 'de audio';
    if (mode === 'video') return 'de video';
    return 'de audio/video';
  }

  if (mode === 'audio') return 'audio';
  if (mode === 'video') return 'video';
  return 'audio/video';
}

function buildSubject(lang: SupportedLanguage): string {
  if (lang === 'fr') return 'Al-Aqd — Alerte d\'appel Mahram';
  if (lang === 'ar') return 'العقد — تنبيه مكالمة المحرم';
  if (lang === 'es') return 'Al-Aqd — Alerta de llamada Mahram';
  return 'Al-Aqd — Mahram Call Alert';
}

function buildBody(
  callerName: string,
  participantName: string | undefined,
  mode: 'audio' | 'video' | undefined,
  callId: string | undefined,
  lang: SupportedLanguage,
): string {
  const greeting = MAHRAM_GREETING[lang] || MAHRAM_GREETING.en;

  if (lang === 'fr') {
    const withWho = participantName ? ` avec ${participantName}` : '';
    const callReference = callId ? `\nReference de l'appel : ${callId}` : '';

    return [
      greeting,
      '',
      `${callerName} est maintenant en communication ${getModeLabel(mode, lang)} sur Al-Aqd${withWho}.`,
      '',
      'Vous recevez ce message en tant que mahram declare.',
      'Pour eviter le spam, les alertes d\'appel mahram sont limitees a un e-mail par heure pour cette relation.',
      callReference,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (lang === 'ar') {
    const withWho = participantName ? ` مع ${participantName}` : '';
    const callReference = callId ? `\nمرجع المكالمة: ${callId}` : '';

    return [
      greeting,
      '',
      `${callerName} متصل(ة) الآن بمكالمة ${getModeLabel(mode, lang)} على Al-Aqd${withWho}.`,
      '',
      'تتلقى هذه الرسالة بصفتك المحرم المصرح به.',
      'لتجنب الرسائل المزعجة، يتم إرسال تنبيهات مكالمات المحرم بحد أقصى بريد واحد كل ساعة لهذه العلاقة.',
      callReference,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (lang === 'es') {
    const withWho = participantName ? ` con ${participantName}` : '';
    const callReference = callId ? `\nReferencia de la llamada: ${callId}` : '';

    return [
      greeting,
      '',
      `${callerName} esta ahora conectado(a) en una llamada ${getModeLabel(mode, lang)} en Al-Aqd${withWho}.`,
      '',
      'Recibes este mensaje como su mahram declarado.',
      'Para evitar spam, las alertas de llamada del mahram se limitan a un correo por hora para esta relacion.',
      callReference,
    ]
      .filter(Boolean)
      .join('\n');
  }

  const withWho = participantName ? ` with ${participantName}` : '';
  const callReference = callId ? `\nCall reference: ${callId}` : '';

  return [
    greeting,
    '',
    `${callerName} is now connected in a ${getModeLabel(mode, lang)} call on Al-Aqd${withWho}.`,
    '',
    'You are receiving this message as their declared mahram.',
    'To avoid spam, mahram call alerts are limited to one email per hour for this relation.',
    callReference,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * POST /api/calls/notify-mahram
 * Sends a mahram call alert email when a call is connected.
 * Enforces a 1-hour cooldown per user-mahram pair.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const payload = (await request.json().catch(() => ({}))) as NotifyPayload;

    const participantId = normalizeOptionalString(payload.participantId);
    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return NextResponse.json({ error: 'Valid participantId is required' }, { status: 400 });
    }

    const mode = payload.mode === 'audio' || payload.mode === 'video' ? payload.mode : undefined;
    const callId = normalizeOptionalString(payload.callId);
    const sessionId = normalizeOptionalString(payload.sessionId);
    const language = normalizeLanguage(normalizeOptionalString(payload.language));

    const caller = await User.findById(authResult.user.userId)
      .select('name mahram')
      .lean();

    if (!caller) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mahramEmail = caller.mahram?.email?.toLowerCase().trim();
    if (!mahramEmail) {
      return NextResponse.json({
        success: true,
        notified: false,
        skipped: true,
        reason: 'no_mahram_configured',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mahramEmail)) {
      return NextResponse.json({
        success: true,
        notified: false,
        skipped: true,
        reason: 'invalid_mahram_email',
      });
    }

    const lastSessionId = caller.mahram?.lastCallNotificationSessionId?.trim();
    if (sessionId && lastSessionId && sessionId === lastSessionId) {
      return NextResponse.json({
        success: true,
        notified: false,
        skipped: true,
        reason: 'already_notified_for_session',
      });
    }

    const now = new Date();
    const lastNotifiedAt = caller.mahram?.lastCallNotificationAt
      ? new Date(caller.mahram.lastCallNotificationAt)
      : undefined;

    if (lastNotifiedAt && now.getTime() - lastNotifiedAt.getTime() < COOLDOWN_MS) {
      return NextResponse.json({
        success: true,
        notified: false,
        skipped: true,
        reason: 'cooldown_active',
        nextEligibleAt: new Date(lastNotifiedAt.getTime() + COOLDOWN_MS).toISOString(),
      });
    }

    const participant = await User.findById(participantId).select('name').lean();
    const participantName = participant?.name?.trim();

    try {
      await sendNotificationEmail({
        to: mahramEmail,
        subject: buildSubject(language),
        body: buildBody(caller.name, participantName, mode, callId, language),
      });
    } catch (emailError) {
      console.error('Failed to send mahram call email:', emailError);
      return NextResponse.json({ error: 'Failed to send mahram notification email' }, { status: 502 });
    }

    const updateFields: Record<string, unknown> = {
      'mahram.lastCallNotificationAt': now,
    };
    if (sessionId) {
      updateFields['mahram.lastCallNotificationSessionId'] = sessionId;
    }

    await User.updateOne(
      { _id: authResult.user.userId },
      { $set: updateFields },
    );

    return NextResponse.json({
      success: true,
      notified: true,
      notifiedAt: now.toISOString(),
      cooldownEndsAt: new Date(now.getTime() + COOLDOWN_MS).toISOString(),
    });
  } catch (error) {
    console.error('Notify mahram call error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
