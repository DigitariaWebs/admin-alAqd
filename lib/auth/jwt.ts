import jwt from 'jsonwebtoken';
import { RefreshToken } from '@/lib/db/models/RefreshToken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JWTPayload {
    userId: string;
    email?: string;
    phoneNumber?: string;
    role: string;
}

export function generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

export function generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresIn = JWT_REFRESH_EXPIRES_IN;
    let expirationDate = new Date();
    
    // Parse expiration time
    if (expiresIn.endsWith('d')) {
        const days = parseInt(expiresIn);
        expirationDate.setDate(expirationDate.getDate() + days);
    } else if (expiresIn.endsWith('h')) {
        const hours = parseInt(expiresIn);
        expirationDate.setHours(expirationDate.getHours() + hours);
    }
    
    await RefreshToken.create({
        userId,
        token,
        expiresAt: expirationDate,
    });
}

export function verifyAccessToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

export async function revokeRefreshToken(token: string): Promise<void> {
    await RefreshToken.updateOne({ token }, { isRevoked: true });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId }, { isRevoked: true });
}
