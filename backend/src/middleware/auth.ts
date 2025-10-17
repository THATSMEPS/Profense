import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { AppError } from './errorHandler';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    console.log('Auth middleware - Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    });

    // Get token from header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Token extracted from Bearer header:', token ? token.substring(0, 20) + '...' : 'none');
    }

    // Get token from cookie (alternative)
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      const tokenCookie = cookies.find((cookie: string) => cookie.trim().startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
        console.log('Token extracted from cookie:', token ? token.substring(0, 20) + '...' : 'none');
      }
    }

    if (!token) {
      console.log('No token found in request');
      throw new AppError('Access token is required', 401);
    }

    // Verify token
    console.log('Attempting to verify token with JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('Token decoded successfully:', { id: decoded.id, email: decoded.email });
    
    if (!decoded || !decoded.id) {
      console.log('Invalid decoded token:', decoded);
      throw new AppError('Invalid token', 401);
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'user'
      };
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

export const adminAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (req.user.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const generateToken = (payload: object): string => {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRE || '24h') as any };
  return jwt.sign(payload, process.env.JWT_SECRET!, options);
};

export const generateRefreshToken = (payload: object): string => {
  const options: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as any };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, options);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
};
