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
 * Send a plain SMS message via Twilio.
 *
 * Configure one of these in your environment:
 *   - TWILIO_MESSAGING_SERVICE_SID (preferred, starts with "MG...")
 *     Handles sender pool, opt-outs (STOP/UNSTOP), and A2P 10DLC routing.
 *   - TWILIO_PHONE_NUMBER (e.g. "+14155551234")
 *     A Twilio-owned SMS-capable phone number used as the sender.
 *
 * If both are set, TWILIO_MESSAGING_SERVICE_SID wins.
 */
export async function sendSMS(to: string, body: string) {
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!messagingServiceSid && !fromNumber) {
        throw new Error(
            'Twilio sender is not configured. Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER in .env',
        );
    }

    await getClient().messages.create({
        to,
        body,
        ...(messagingServiceSid
            ? { messagingServiceSid }
            : { from: fromNumber! }),
    });
}
