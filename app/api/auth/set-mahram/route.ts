import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { sendSMS } from '@/lib/sms';
import { sendNotificationEmail } from '@/lib/email';

const RELATIONSHIP_LABELS: Record<string, Record<string, string>> = {
  father: { en: 'daughter', fr: 'fille', ar: 'ابنتك', es: 'hija' },
  brother: { en: 'sister', fr: 'soeur', ar: 'أختك', es: 'hermana' },
  paternalUncle: { en: 'niece', fr: 'nièce', ar: 'ابنة أخيك', es: 'sobrina' },
  maternalUncle: { en: 'niece', fr: 'nièce', ar: 'ابنة أختك', es: 'sobrina' },
  grandfather: { en: 'granddaughter', fr: 'petite-fille', ar: 'حفيدتك', es: 'nieta' },
  son: { en: 'mother', fr: 'mère', ar: 'والدتك', es: 'madre' },
  muslimFriend: { en: 'friend', fr: 'amie', ar: 'صديقتك', es: 'amiga' },
  sisterInIslam: { en: 'sister in Islam', fr: 'soeur en Islam', ar: 'أختك في الإسلام', es: 'hermana en el Islam' },
  communityRepresentative: { en: 'community member', fr: 'membre de la communauté', ar: 'فرد من مجتمعك', es: 'miembro de la comunidad' },
  other: { en: 'relative', fr: 'proche', ar: 'قريبتك', es: 'familiar' },
};

const MAHRAM_GREETING: Record<string, string> = {
  en: 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh,',
  fr: 'Assalamou Alaykoum wa Rahmatoullahi wa Barakatouh,',
  ar: 'السلام عليكم ورحمة الله وبركاته،',
  es: 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh,',
};

function buildSmsBody(userName: string, relationship: string, lang: string): string {
  const l = ['fr', 'ar', 'es'].includes(lang) ? lang : 'en';
  const relLabel = RELATIONSHIP_LABELS[relationship]?.[l] || RELATIONSHIP_LABELS['other'][l];

  if (l === 'fr') {
    return `Assalamou Alaykoum,\nVotre ${relLabel}, ${userName}, a rejoint Al-Aqd, une application de mariage halal. Elle a choisi de vous informer en tant que son mahram.\nQu'Allah vous bénisse.`;
  }
  if (l === 'ar') {
    return `السلام عليكم،\n${relLabel}، ${userName}، انضمت إلى تطبيق العقد للزواج الحلال. لقد اختارت إبلاغك بصفتك محرمها.\nبارك الله فيكم.`;
  }
  if (l === 'es') {
    return `Assalamu Alaikum,\nSu ${relLabel}, ${userName}, se ha unido a Al-Aqd, una app de matrimonio halal. Ella eligió informarle como su mahram.\nQue Allah los bendiga.`;
  }
  return `Assalamu Alaikum,\nYour ${relLabel}, ${userName}, has joined Al-Aqd, a halal matrimony app. She chose to inform you as her mahram.\nMay Allah bless you.`;
}

function buildEmailBody(userName: string, relationship: string, lang: string): string {
  const l = ['fr', 'ar', 'es'].includes(lang) ? lang : 'en';
  const relLabel = RELATIONSHIP_LABELS[relationship]?.[l] || RELATIONSHIP_LABELS['other'][l];
  const greeting = MAHRAM_GREETING[l] || MAHRAM_GREETING['en'];

  if (l === 'fr') {
    return `${greeting}\n\nVotre ${relLabel}, ${userName}, a rejoint Al-Aqd — une application de mariage halal conçue pour aider les musulmans à trouver un partenaire de vie de manière respectueuse et conforme aux valeurs islamiques.\n\nElle a choisi de vous informer en tant que son mahram, car votre bénédiction et votre soutien comptent pour elle.\n\nAl-Aqd met la transparence et les valeurs familiales au cœur de son fonctionnement. Si vous avez des questions, n'hésitez pas à en discuter avec elle.\n\nQu'Allah vous bénisse et bénisse votre famille.`;
  }
  if (l === 'ar') {
    return `${greeting}\n\n${relLabel}، ${userName}، انضمت إلى تطبيق العقد — تطبيق زواج حلال مصمم لمساعدة المسلمين في إيجاد شريك حياة بطريقة تحترم القيم الإسلامية.\n\nلقد اختارت إبلاغك بصفتك محرمها، لأن دعمك ومباركتك يعنيان لها الكثير.\n\nتطبيق العقد يضع الشفافية والقيم العائلية في صميم عمله. إذا كانت لديك أي أسئلة، لا تتردد في التحدث معها.\n\nبارك الله فيكم وفي عائلتكم.`;
  }
  if (l === 'es') {
    return `${greeting}\n\nSu ${relLabel}, ${userName}, se ha unido a Al-Aqd — una aplicación de matrimonio halal diseñada para ayudar a los musulmanes a encontrar un compañero de vida de manera respetuosa y conforme a los valores islámicos.\n\nElla eligió informarle como su mahram, porque su apoyo y bendición significan mucho para ella.\n\nAl-Aqd pone la transparencia y los valores familiares en el centro de su funcionamiento. Si tiene alguna pregunta, no dude en hablar con ella.\n\nQue Allah los bendiga a usted y a su familia.`;
  }
  return `${greeting}\n\nYour ${relLabel}, ${userName}, has joined Al-Aqd — a halal matrimony app designed to help Muslims find a life partner in a respectful way that honors Islamic values.\n\nShe chose to inform you as her mahram, because your blessing and support mean a lot to her.\n\nAl-Aqd puts transparency and family values at its core. If you have any questions, feel free to discuss them with her.\n\nMay Allah bless you and your family.`;
}

function getEmailSubject(lang: string): string {
  if (lang === 'fr') return 'Al-Aqd — Notification Mahram';
  if (lang === 'ar') return 'العقد — إشعار المحرم';
  if (lang === 'es') return 'Al-Aqd — Notificación Mahram';
  return 'Al-Aqd — Mahram Notification';
}

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { email, phoneNumber, relationship, language } = await request.json();

    if (!relationship) {
      return NextResponse.json({ error: 'Relationship is required' }, { status: 400 });
    }

    const normalizedPhone = phoneNumber ? phoneNumber.trim() : undefined;
    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

    if (!normalizedPhone && !normalizedEmail) {
      return NextResponse.json({ error: 'At least a phone number or email is required' }, { status: 400 });
    }

    if (normalizedPhone && !/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format. Use international format (e.g. +33612345678)' }, { status: 400 });
    }

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const validRelationships = ['father', 'brother', 'paternalUncle', 'maternalUncle', 'grandfather', 'son', 'muslimFriend', 'sisterInIslam', 'communityRepresentative', 'other'];
    if (!validRelationships.includes(relationship)) {
      return NextResponse.json({ error: 'Invalid relationship' }, { status: 400 });
    }

    const user = await User.findById(authResult.user.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update mahram info
    user.mahram = {
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      relationship,
      notifiedAt: new Date(),
    };
    await user.save();

    const lang = language || 'en';

    // Send SMS notification (bilingual if not Arabic)
    if (normalizedPhone) {
      try {
        let sms = buildSmsBody(user.name, relationship, lang);
        if (lang !== 'ar') {
          sms += '\n\n---\n\n' + buildSmsBody(user.name, relationship, 'ar');
        }
        await sendSMS(normalizedPhone, sms);
      } catch (smsError) {
        console.error('Failed to send mahram SMS:', smsError);
      }
    }

    // Send email notification (bilingual if not Arabic)
    if (normalizedEmail) {
      try {
        let body = buildEmailBody(user.name, relationship, lang);
        if (lang !== 'ar') {
          body += '\n\n━━━━━━━━━━━━━━━━━━━━\n\n' + buildEmailBody(user.name, relationship, 'ar');
        }
        await sendNotificationEmail({
          to: normalizedEmail,
          subject: lang !== 'ar' ? `${getEmailSubject(lang)} / ${getEmailSubject('ar')}` : getEmailSubject('ar'),
          body,
        });
      } catch (emailError) {
        console.error('Failed to send mahram email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      mahram: {
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        relationship,
        notifiedAt: user.mahram.notifiedAt,
      },
    });
  } catch (error) {
    console.error('Set mahram error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
