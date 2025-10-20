import jwt from 'jsonwebtoken';
import axios from 'axios';
import { TokenPayload, VerifyTokenResponse, User, AuthConfig } from './types';

export class AuthService {
  private authUrl: string;

  constructor(authUrl: string) {
    this.authUrl = authUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Extract token from request headers
   */
  extractTokenFromRequest(request: any): string | null {
    const authHeader = request.headers.get?.('authorization') || 
                      request.headers.authorization ||
                      request.header?.('authorization');
    return this.extractTokenFromHeader(authHeader);
  }

  /**
   * Verify token with auth service
   */
  async verifyTokenWithService(token: string): Promise<VerifyTokenResponse> {
    try {
      const response = await axios.post(
        `${this.authUrl}/api/auth/verify`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('Token verification failed:', error);
      return {
        success: false,
        error: 'Token verification failed',
        data: { valid: false }
      } as VerifyTokenResponse;
    }
  }

  /**
   * Get user profile from auth service
   */
  async getUserProfile(token: string): Promise<User | null> {
    try {
      const response = await axios.get(`${this.authUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.data.success) {
        return response.data.data.user;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Verify token and return user data
   */
  async verifyToken(request: any): Promise<User | null> {
    const token = this.extractTokenFromRequest(request);
    
    if (!token) {
      return null;
    }

    // First verify token with auth service
    const verifyResponse = await this.verifyTokenWithService(token);
    
    if (!verifyResponse.success || !verifyResponse.data?.valid) {
      return null;
    }

    // Get full user profile
    return this.getUserProfile(token);
  }

  /**
   * Check if user has required role
   */
  hasRole(user: User, requiredRoles: string[]): boolean {
    return requiredRoles.includes(user.role);
  }

  /**
   * Check if path should be protected
   */
  isProtectedPath(path: string, config: AuthConfig): boolean {
    // Check if explicitly public
    if (config.publicRoutes?.some(route => path.startsWith(route))) {
      return false;
    }

    // Check if explicitly protected
    if (config.protectedRoutes?.some(route => path.startsWith(route))) {
      return true;
    }

    // Default: protect all routes except /api/health and /api/auth
    return !path.startsWith('/api/health') && !path.startsWith('/api/auth');
  }

  /**
   * Create authentication response
   */
  createAuthResponse(success: boolean, message: string, status: number = 401) {
    return new Response(
      JSON.stringify({
        success,
        error: message,
      }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}