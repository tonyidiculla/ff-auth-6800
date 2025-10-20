import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { UserService } from '@/lib/database';
import { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, role } = await req.json();

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!AuthService.isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = AuthService.isValidPassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password);

    // Create user
    const user = await UserService.create({
      email,
      password: '', // Not used since we pass passwordHash separately
      firstName,
      lastName,
      role: role || UserRole.USER,
      passwordHash,
    });

    // Generate tokens
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    const refreshToken = AuthService.generateRefreshToken(user.id);

    // Store refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);
    await UserService.storeRefreshToken(refreshToken, user.id, refreshTokenExpiry);

    return NextResponse.json({
      success: true,
      data: {
        user,
        token,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}