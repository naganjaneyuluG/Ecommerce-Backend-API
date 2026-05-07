import RefreshToken, { IRefreshToken } from './auth.model';
import User, { IUser } from '@modules/users/user.model';
import { FilterQuery } from 'mongoose';

export class AuthRepository {
  // ---- User queries for auth ----
  async findUserByEmail(email: string, selectPassword = false): Promise<IUser | null> {
    const query = User.findOne({ email });
    if (selectPassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findUserById(userId: string, selectFields?: string): Promise<IUser | null> {
    const query = User.findById(userId);
    if (selectFields) {
      query.select(selectFields);
    }
    return query.exec();
  }

  async createUser(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async updateUser(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, data, { new: true }).exec();
  }

  async findUserByVerificationToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: new Date() },
    })
      .select('+verificationToken +verificationTokenExpiry')
      .exec();
  }

  async findUserByResetToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: { $gt: new Date() },
    })
      .select('+resetPasswordToken +resetPasswordTokenExpiry +password')
      .exec();
  }

  // ---- Refresh token queries ----
  async createRefreshToken(data: Partial<IRefreshToken>): Promise<IRefreshToken> {
    const token = new RefreshToken(data);
    return token.save();
  }

  async findRefreshToken(query: FilterQuery<IRefreshToken>): Promise<IRefreshToken | null> {
    return RefreshToken.findOne(query).exec();
  }

  async revokeRefreshToken(tokenId: string, replacedBy?: string): Promise<void> {
    await RefreshToken.findByIdAndUpdate(tokenId, {
      isRevoked: true,
      ...(replacedBy && { replacedBy }),
    }).exec();
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    ).exec();
  }

  async deleteExpiredTokens(): Promise<void> {
    await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() },
    }).exec();
  }
}
