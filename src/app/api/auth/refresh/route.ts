import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { UserService } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = AuthService.verifyRefreshToken(refreshToken);
    
    // Validate refresh token in database
    const userId = await UserService.validateRefreshToken(refreshToken);
    if (!userId || userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await UserService.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Generate new access token
    const newToken = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Generate new refresh token
    const newRefreshToken = AuthService.generateRefreshToken(user.id);

    // Store new refresh token and remove old one
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);
    await UserService.removeRefreshToken(refreshToken);
    await UserService.storeRefreshToken(newRefreshToken, user.id, refreshTokenExpiry);

    return NextResponse.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 }
    );
  }
}