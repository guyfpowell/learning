import { prisma } from '../db';
import { hashPassword, comparePassword } from '../middleware/passwords';
import { signToken, TokenPayload } from '../middleware/jwt';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(
        ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        'Email already registered',
        409
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        profile: {
          create: {},
        },
      },
    });

    // Generate token
    const token = signToken({
      id: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
        401
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
        401
      );
    }

    // Generate token
    const token = signToken({
      id: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    return user;
  }
}

export const authService = new AuthService();
