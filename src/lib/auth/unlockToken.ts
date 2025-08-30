import jwt from 'jsonwebtoken';
import { UnlockTokenPayload } from '@/types';

const JWT_SECRET = process.env.UNLOCK_JWT_SECRET || 'fallback-secret-for-dev';
const JWT_TTL = Number(process.env.UNLOCK_JWT_TTL_SECONDS || 900); // 15 minutes

export function signUnlockToken(payload: Omit<UnlockTokenPayload, 'iat'>): string {
  const fullPayload: UnlockTokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(fullPayload, JWT_SECRET, {
    expiresIn: JWT_TTL,
  });
}

export function verifyUnlockToken(token: string): UnlockTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UnlockTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

export function isTokenValid(token: string): boolean {
  try {
    verifyUnlockToken(token);
    return true;
  } catch {
    return false;
  }
}