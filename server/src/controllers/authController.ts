import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod/v4';
import prisma from '../utils/prisma.js';
import { Role } from '../generated/prisma/client.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';

// ─── Validation Schemas ─────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['YOUTH', 'COORDINATOR', 'CLIENT'] as const),
  phone: z.string().optional(),
  orgName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Token Helpers ──────────────────────────────────────────────────────────

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  } as jwt.SignOptions);
}

function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions);
}

// ─── Register ───────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.parse(req.body);
  const { name, email, password, role, phone, orgName } = parsed;

  // If role is CLIENT, orgName is required
  if (role === 'CLIENT' && (!orgName || orgName.trim().length === 0)) {
    throw new AppError('Organization name is required for client accounts.', 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('A user with this email already exists.', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user with profile in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as Role,
        phone: phone || null,
      },
    });

    // Create role-specific profile
    if (role === 'YOUTH') {
      await tx.youthProfile.create({
        data: { userId: newUser.id },
      });
    }

    if (role === 'CLIENT') {
      await tx.clientProfile.create({
        data: {
          userId: newUser.id,
          orgName: orgName!,
        },
      });
    }

    return newUser;
  });

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  ApiResponse.success(
    res,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    },
    'Registration successful',
    201
  );
};

// ─── Login ──────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.parse(req.body);
  const { email, password } = parsed;

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  ApiResponse.success(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    accessToken,
    refreshToken,
  }, 'Login successful');
};

// ─── Refresh Token ──────────────────────────────────────────────────────────

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const parsed = refreshSchema.parse(req.body);
  const { refreshToken } = parsed;

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as TokenPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or account deactivated.', 401);
    }

    // Generate new access token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    ApiResponse.success(res, {
      accessToken: newAccessToken,
    }, 'Token refreshed successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token has expired. Please log in again.', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid refresh token.', 401);
    }
    throw new AppError('Could not refresh token.', 401);
  }
};

// ─── Get Current User ───────────────────────────────────────────────────────

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Not authenticated.', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      youthProfile: true,
      clientProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Return only the relevant profile based on role
  const { youthProfile, clientProfile, ...userData } = user;

  const responseData: Record<string, unknown> = { ...userData };

  if (user.role === 'YOUTH' && youthProfile) {
    responseData.youthProfile = youthProfile;
  }

  if (user.role === 'CLIENT' && clientProfile) {
    responseData.clientProfile = clientProfile;
  }

  ApiResponse.success(res, responseData, 'User profile retrieved');
};
