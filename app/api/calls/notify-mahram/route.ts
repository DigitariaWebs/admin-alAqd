import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { sendSMS } from '@/lib/sms';
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
  const labels: Record<SupportedLanguage, Record<string, string>> = {
    en: { audio: 'audio', video: 'video', default: 'audio/video' },
    fr: { audio: 'audio', video: 'vidéo', default: 'audio/vidéo' },
    ar: { audio: 'صوتية', video: 'فيديو', default: 'صوتية/فيديو' },
    es: { audio: 'de audio', video: 'de video', default: 'de audio/video' },
  };
  return labels[lang][mode || 'default'];
}

function buildSmsBody(
  callerName: string,
  participantName: string | undefined,
  mode: 'audio' | 'video' | undefined,
  lang: SupportedLanguage,
): string {
  const modeLabel = getModeLabel(mode, lang);
  const withWho = participantName ? ` ${lang === 'ar' ? 'مع' : lang === 'fr' ? 'avec' : lang === 'es' ? 'con' : 'with'} ${participantName}` : '';

  if (lang === 'fr') {
    return `Al-Aqd: ${callerName} est en appel ${modeLabel}${withWho}. Vous recevez ce message en tant que mahram déclaré.`;
  }
  if (lang === 'ar') {
    return `العقد: ${callerName} في مكالمة ${modeLabel}${withWho}. تتلقى هذه الرسالة بصفتك المحرم المصرح به.`;
  }
  if (lang === 'es') {
    return `Al-Aqd: ${callerName} está en una llamada ${modeLabel}${withWho}. Recibe este mensaje como su mahram declarado.`;
  }
  return `Al-Aqd: ${callerName} is in a ${modeLabel} call${withWho}. You are receiving this as their declared mahram.`;
}

const MAHRAM_GREETING: Record<SupportedLanguage, string> = {
  en: 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh,',
  fr: 'Assalamou Alaykoum wa Rahmatoullahi wa Barakatouh,',
  ar: 'السلام عليكم ورحمة الله وبركاته،',
  es: 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh,',
};

function buildEmailSubject(lang: SupportedLanguage): string {
  if (lang === 'fr') return 'Al-Aqd — Alerte d\'appel Mahram';
  if (lang === 'ar') return 'العقد — تنبيه مكالمة المحرم';
  if (lang === 'es') return 'Al-Aqd — Alerta de llamada Mahram';
  return 'Al-Aqd — Mahram Call Alert';
}

function buildEmailBody(
  callerName: string,
  participantName: string | undefined,
  mode: 'audio' | 'video' | undefined,
  lang: SupportedLanguage,
): string {
  const greeting = MAHRAM_GREETING[lang];
  const modeLabel = getModeLabel(mode, lang);
  const withWho = participantName ? ` ${lang === 'ar' ? 'مع' : lang === 'fr' ? 'avec' : lang === 'es' ? 'con' : 'with'} ${participantName}` : '';

  if (lang === 'fr') {
    return `${greeting}\n\n${callerName} est maintenant en communication ${modeLabel} sur Al-Aqd${withWho}.\n\nVous recevez ce message en tant que mahram déclaré.\nPour éviter le spam, les alertes d'appel mahram sont limitées à un message par heure.`;
  }
  if (lang === 'ar') {
    return `${greeting}\n\n${callerName} متصل(ة) الآن بمكالمة ${modeLabel} على العقد${withWho}.\n\nتتلقى هذه الرسالة بصفتك المحرم المصرح به.\nلتجنب الرسائل المزعجة، يتم إرسال تنبيهات المحرم بحد أقصى رسالة واحدة كل ساعة.`;
  }
  if (lang === 'es') {
    return `${greeting}\n\n${callerName} está ahora conectado(a) en una llamada ${modeLabel} en Al-Aqd${withWho}.\n\nRecibes este mensaje como su mahram declarado.\nPara evitar spam, las alertas de llamada del mahram se limitan a un mensaje por hora.`;
  }
  return `${greeting}\n\n${callerName} is now connected in a ${modeLabel} call on Al-Aqd${withWho}.\n\nYou are receiving this message as their declared mahram.\nTo avoid spam, mahram call alerts are limited to one message per hour.`;
}

/**
 * POST /api/calls/notify-mahram
 * Sends a mahram call alert SMS when a call is connected.
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
    const sessionId = normalizeOptionalString(payload.sessionId);
    const language = normalizeLanguage(normalizeOptionalString(payload.language));

    const caller = await User.findById(authResult.user.userId)
      .select('name mahram')
      .lean();

    if (!caller) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mahramPhone = caller.mahram?.phoneNumber?.trim();
    const mahramEmail = caller.mahram?.email?.toLowerCase().trim();
    const hasValidPhone = mahramPhone && /^\+[1-9]\d{6,14}$/.test(mahramPhone);
    const hasValidEmail = mahramEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mahramEmail);

    if (!hasValidPhone && !hasValidEmail) {
      return NextResponse.json({
        success: true,
        notified: false,
        skipped: true,
        reason: 'no_mahram_configured',
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

    let notificationSent = false;

    // Send SMS (bilingual if not Arabic)
    if (hasValidPhone) {
      try {
        let sms = buildSmsBody(caller.name, participantName, mode, language);
        if (language !== 'ar') {
          sms += '\n\n---\n\n' + buildSmsBody(caller.name, participantName, mode, 'ar');
        }
        await sendSMS(mahramPhone!, sms);
        notificationSent = true;
      } catch (smsError) {
        console.error('Failed to send mahram call SMS:', smsError);
      }
    }

    // Send email (bilingual if not Arabic)
    if (hasValidEmail) {
      try {
        let body = buildEmailBody(caller.name, participantName, mode, language);
        if (language !== 'ar') {
          body += '\n\n━━━━━━━━━━━━━━━━━━━━\n\n' + buildEmailBody(caller.name, participantName, mode, 'ar');
        }
        await sendNotificationEmail({
          to: mahramEmail!,
          subject: language !== 'ar' ? `${buildEmailSubject(language)} / ${buildEmailSubject('ar')}` : buildEmailSubject('ar'),
          body,
        });
        notificationSent = true;
      } catch (emailError) {
        console.error('Failed to send mahram call email:', emailError);
      }
    }

    if (!notificationSent) {
      return NextResponse.json({ error: 'Failed to send mahram notification' }, { status: 502 });
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
