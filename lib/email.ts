import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

interface SendNotificationEmailOptions {
    to: string;
    subject: string;
    body: string;
    imageBase64?: string;
}

/**
 * Send a notification email to a user.
 * Optionally embeds an inline image.
 */
export async function sendNotificationEmail({ to, subject, body, imageBase64 }: SendNotificationEmailOptions) {
    const hasImage = imageBase64 && imageBase64.startsWith('data:');

    // Extract mime type and base64 content
    let imageCid = '';
    let attachments: any[] = [];
    if (hasImage) {
        const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
            const mimeType = matches[1];
            const ext = mimeType.split('/')[1];
            imageCid = `notification-image@al-aqd`;
            attachments = [{
                filename: `notification.${ext}`,
                content: matches[2],
                encoding: 'base64',
                cid: imageCid,
            }];
        }
    }

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #52101b; margin: 0;">${subject}</h2>
            </div>
            ${imageCid ? `<div style="text-align: center; margin-bottom: 20px;"><img src="cid:${imageCid}" style="max-width: 100%; border-radius: 12px;" /></div>` : ''}
            <div style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body}</div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">Al-Aqd — Cette notification a été envoyée depuis le tableau de bord admin.</p>
        </div>
    `;

    await transporter.sendMail({
        from: `"Al-Aqd" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlBody,
        attachments,
    });
}
