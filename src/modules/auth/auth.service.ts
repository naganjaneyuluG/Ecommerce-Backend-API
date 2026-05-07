import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { hashPassword, comparePassword } from '@shared/utils/hash.util';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailToken,
  hashEmailToken,
} from '@shared/utils/token.util';
import { sendEmail, emailTemplates } from '@shared/utils/email.util';
import { Role } from '@shared/types/enums';
import { ITokenPayload } from '@shared/types/interfaces';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, ResendVerificationInput } from './auth.dto';
import env from '@/config/env.config';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    isVerified: boolean;
  };
  tokens: AuthTokens;
}

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(data: RegisterInput): Promise<AuthResult> {
    // Check if user exists
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email already registered', StatusCodes.CONFLICT);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate email verification token
    const verificationToken = generateEmailToken();
    const hashedVerificationToken = hashEmailToken(verificationToken);

    // Create user
    const user = await this.authRepository.createUser({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Generate tokens
    const tokenPayload: ITokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokenPair(tokenPayload);

    // Store refresh token
    await this.authRepository.createRefreshToken({
      token: tokens.refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Send verification email (fire and forget)
    const verifyLink = `${env.CLIENT_URL}/verify-email/${verificationToken}`;
    sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Ecommerce Store',
      html: emailTemplates.verifyEmail(user.name, verifyLink),
    }).catch((err: Error) => {
      console.error('Failed to send verification email:', err.message);
    });

    return {
      user: {
      id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      tokens,
    };
  }

  async login(data: LoginInput): Promise<AuthResult> {
    // Find user with password
    const user = await this.authRepository.findUserByEmail(data.email, true);
    if (!user) {
      throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', StatusCodes.FORBIDDEN);
    }

    // Compare password
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
    }

    // Generate tokens
    const tokenPayload: ITokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokenPair(tokenPayload);

    // Store refresh token
    await this.authRepository.createRefreshToken({
      token: tokens.refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
      id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      tokens,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const storedToken = await this.authRepository.findRefreshToken({
      token: refreshToken,
      isRevoked: false,
    });

    if (storedToken) {
      await this.authRepository.revokeRefreshToken((storedToken._id as any).toString());
    }
  }

  async refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
    // Find the stored refresh token
    const storedToken = await this.authRepository.findRefreshToken({
      token: oldRefreshToken,
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
    }

    // Reuse detection: if token is already revoked, revoke all user tokens
    if (storedToken.isRevoked) {
      await this.authRepository.revokeAllUserTokens(storedToken.userId.toString());
      throw new AppError(
        'Refresh token reuse detected. All sessions revoked.',
        StatusCodes.UNAUTHORIZED
      );
    }

    // Check expiry
    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.revokeRefreshToken((storedToken._id as any).toString());
      throw new AppError('Refresh token expired', StatusCodes.UNAUTHORIZED);
    }

    // Verify JWT
    let decoded: ITokenPayload;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch {
      await this.authRepository.revokeRefreshToken((storedToken._id as any).toString());
      throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
    }

    // Get user
    const user = await this.authRepository.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', StatusCodes.UNAUTHORIZED);
    }

    // Generate new token pair (rotation)
    const tokenPayload: ITokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const newTokens = this.generateTokenPair(tokenPayload);

    // Revoke old, link to new
      (storedToken._id as any).toString(),

    // Store new refresh token
    await this.authRepository.createRefreshToken({
      token: newTokens.refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return newTokens;
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = hashEmailToken(token);
    const user = await this.authRepository.findUserByVerificationToken(hashedToken);

    if (!user) {
      throw new AppError('Invalid or expired verification token', StatusCodes.BAD_REQUEST);
    }

    await this.authRepository.updateUser((user._id as any).toString(), {
      isVerified: true,
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
    });

    // Send welcome email
    sendEmail({
      to: user.email,
      subject: 'Welcome to Ecommerce Store!',
      html: emailTemplates.welcome(user.name),
    }).catch((err: Error) => {
      console.error('Failed to send welcome email:', err.message);
    });
  }

  async forgotPassword(data: ForgotPasswordInput): Promise<void> {
    const user = await this.authRepository.findUserByEmail(data.email);
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = generateEmailToken();
    const hashedResetToken = hashEmailToken(resetToken);

    await this.authRepository.updateUser((user._id as any).toString(), {
      resetPasswordToken: hashedResetToken,
      resetPasswordTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    const resetLink = `${env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset Your Password - Ecommerce Store',
      html: emailTemplates.resetPassword(user.name, resetLink),
    });
  }

  async resetPassword(token: string, data: ResetPasswordInput): Promise<void> {
    const hashedToken = hashEmailToken(token);
    const user = await this.authRepository.findUserByResetToken(hashedToken);

    if (!user) {
      throw new AppError('Invalid or expired reset token', StatusCodes.BAD_REQUEST);
    }

    const hashedPassword = await hashPassword(data.password);

    await this.authRepository.updateUser((user._id as any).toString(), {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordTokenExpiry: undefined,
    });

    await this.authRepository.revokeAllUserTokens((user._id as any).toString());
  }

  async resendVerificationEmail(data: ResendVerificationInput): Promise<void> {
    const user = await this.authRepository.findUserByEmail(data.email);

    if (!user) {
      // Don't reveal if user exists for security, but we want to be helpful here
      // Alternatively, just throw if not found. Let's be helpful for resend.
      throw new AppError('No account found with this email', StatusCodes.NOT_FOUND);
    }

    if (user.isVerified) {
      throw new AppError('Email is already verified', StatusCodes.BAD_REQUEST);
    }

    // Generate new token
    const verificationToken = generateEmailToken();
    const hashedVerificationToken = hashEmailToken(verificationToken);

    await this.authRepository.updateUser((user._id as any).toString(), {
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyLink = `${env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Ecommerce Store',
      html: emailTemplates.verifyEmail(user.name, verifyLink),
    });
  }

  private generateTokenPair(payload: ITokenPayload): AuthTokens {
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }
}
