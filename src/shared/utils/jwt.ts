import jwt from 'jsonwebtoken';
import { env } from '../../config/environment';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class JwtService {
  static generateAccessToken(payload: TokenPayload): string {
    const secret = env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const expiresIn = env.JWT_EXPIRES_IN || '7d';
    
    return jwt.sign(payload, secret, { 
      expiresIn: expiresIn as jwt.SignOptions['expiresIn']
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    const secret = env.REFRESH_TOKEN_SECRET || env.JWT_SECRET;
    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET or JWT_SECRET is not defined');
    }

    return jwt.sign(payload, secret, { 
      expiresIn: '30d' as jwt.SignOptions['expiresIn']
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    const secret = env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
      const decoded = jwt.verify(token, secret);
      return decoded as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    const secret = env.REFRESH_TOKEN_SECRET || env.JWT_SECRET;
    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET or JWT_SECRET is not defined');
    }

    try {
      const decoded = jwt.verify(token, secret);
      return decoded as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}