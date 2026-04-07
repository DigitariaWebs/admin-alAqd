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
 * Send an SMS message via Twilio Messaging Service (AlAqd sender ID).
 */
export async function sendSMS(to: string, body: string) {
    await getClient().messages.create({
        to,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
        body,
    });
}
