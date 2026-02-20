import { NextRequest } from 'next/server';
import { verifyAccessToken, JWTPayload } from './jwt';

export interface AuthRequest extends NextRequest {
    user?: JWTPayload;
}

export function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    return authHeader.split(' ')[1];
}

export function verifyAuth(request: NextRequest): JWTPayload | null {
    const token = getTokenFromRequest(request);
    
    if (!token) {
        return null;
    }
    
    return verifyAccessToken(token);
}

export function requireAuth(request: NextRequest): { user: JWTPayload } | { error: string; status: number } {
    const user = verifyAuth(request);
    
    if (!user) {
        return { error: 'Unauthorized', status: 401 };
    }
    
    return { user };
}

export function requireRole(request: NextRequest, allowedRoles: string[]): { user: JWTPayload } | { error: string; status: number } {
    const authResult = requireAuth(request);
    
    if ('error' in authResult) {
        return authResult;
    }
    
    if (!allowedRoles.includes(authResult.user.role)) {
        return { error: 'Forbidden', status: 403 };
    }
    
    return authResult;
}
