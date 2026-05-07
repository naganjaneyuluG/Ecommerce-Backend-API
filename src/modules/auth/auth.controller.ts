import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { AuthService } from './auth.service';
import env from '@/config/env.config';

const authService = new AuthService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export class AuthController {
  register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.register(req.body);

    // Set cookies
    res.cookie('accessToken', result.tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess({
      res,
      statusCode: StatusCodes.CREATED,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  });

  login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.login(req.body);

    res.cookie('accessToken', result.tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  });

  logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = (req.cookies?.refreshToken as string) || '';

    await authService.logout(refreshToken);

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Logged out successfully',
    });
  });

  refreshToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const oldRefreshToken = (req.cookies?.refreshToken as string) || req.body?.refreshToken;

    if (!oldRefreshToken) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Refresh token is required',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const tokens = await authService.refreshTokens(oldRefreshToken);

    res.cookie('accessToken', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Tokens refreshed successfully',
      data: { tokens },
    });
  });

  verifyEmail = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.verifyEmail(req.params['token'] as string);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Email verified successfully',
    });
  });

  forgotPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.forgotPassword(req.body);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  });

  resetPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.resetPassword(req.params['token'] as string, req.body);

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Password reset successful. Please login with your new password.',
    });
  });

  resendVerification = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.resendVerificationEmail(req.body);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Verification email has been resent.',
    });
  });
}
