import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
    if (!client) {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !token || !sid.startsWith('AC')) {
            throw new Error('Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
        }
        client = twilio(sid, token);
    }
    return client;
}

/**
 * Send a WhatsApp message via Twilio.
 */
export async function sendSMS(to: string, body: string) {
    const whatsappFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`;
    const whatsappTo = `whatsapp:${to}`;

    await getClient().messages.create({
        to: whatsappTo,
        from: whatsappFrom,
        body,
    });
}
