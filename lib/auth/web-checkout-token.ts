import jwt from 'jsonwebtoken';
import type { PlanId } from '@/lib/subscription/plans';

const SECRET =
    process.env.WEB_CHECKOUT_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    'web-checkout-token-secret';

const TTL_SECONDS = 10 * 60; // 10 minutes

export interface WebCheckoutTokenPayload {
    userId: string;
    planId?: PlanId;
    firstName?: string;
    scope: 'subscribe';
}

export function signWebCheckoutToken(payload: Omit<WebCheckoutTokenPayload, 'scope'>): string {
    return jwt.sign(
        { ...payload, scope: 'subscribe' as const },
        SECRET,
        { expiresIn: TTL_SECONDS },
    );
}

export function verifyWebCheckoutToken(token: string): WebCheckoutTokenPayload | null {
    try {
        const decoded = jwt.verify(token, SECRET) as WebCheckoutTokenPayload;
        if (decoded.scope !== 'subscribe') return null;
        return decoded;
    } catch {
        return null;
    }
}
