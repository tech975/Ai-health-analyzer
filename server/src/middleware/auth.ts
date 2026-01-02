import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { User } from '../models/User';
import { AppError } from './errorHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Access token is required') as AppError;
      error.statusCode = 401;
      error.code = 'MISSING_TOKEN';
      return next(error);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch (jwtError) {
      const error = new Error('Invalid or expired token') as AppError;
      error.statusCode = 401;
      error.code = 'INVALID_TOKEN';
      return next(error);
    }

    // Get user from database
    const user = await User.findById(payload.userId);
    if (!user) {
      const error = new Error('User not found') as AppError;
      error.statusCode = 401;
      error.code = 'USER_NOT_FOUND';
      return next(error);
    }

    // Add user to request object
    req.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    next(error);
  }
};