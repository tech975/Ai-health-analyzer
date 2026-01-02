import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { registerSchema, loginSchema } from '../utils/validation';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      const appError = new Error(error.details[0].message) as AppError;
      appError.statusCode = 400;
      appError.code = 'VALIDATION_ERROR';
      return next(appError);
    }

    const { email, password, firstName, lastName } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const appError = new Error('User with this email already exists') as AppError;
      appError.statusCode = 409;
      appError.code = 'USER_EXISTS';
      return next(appError);
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      const appError = new Error(error.details[0].message) as AppError;
      appError.statusCode = 400;
      appError.code = 'VALIDATION_ERROR';
      return next(appError);
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const appError = new Error('Invalid email or password') as AppError;
      appError.statusCode = 401;
      appError.code = 'INVALID_CREDENTIALS';
      return next(appError);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const appError = new Error('Invalid email or password') as AppError;
      appError.statusCode = 401;
      appError.code = 'INVALID_CREDENTIALS';
      return next(appError);
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // User is already attached to req by authenticate middleware
    if (!req.user) {
      const appError = new Error('User not authenticated') as AppError;
      appError.statusCode = 401;
      appError.code = 'NOT_AUTHENTICATED';
      return next(appError);
    }

    // Get full user data from database
    const user = await User.findById(req.user.id);
    if (!user) {
      const appError = new Error('User not found') as AppError;
      appError.statusCode = 404;
      appError.code = 'USER_NOT_FOUND';
      return next(appError);
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};