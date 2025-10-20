import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);

    return NextResponse.json({
      success: true,
      data: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        valid: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid token', data: { valid: false } },
      { status: 401 }
    );
  }
}