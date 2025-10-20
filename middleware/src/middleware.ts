import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth-service';
import { AuthConfig, User, UserRole } from './types';

/**
 * Create Next.js middleware for authentication
 */
export function withAuth(config: AuthConfig) {
  const authService = new AuthService(config.authUrl);

  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip authentication for public routes and health checks
    if (!authService.isProtectedPath(pathname, config)) {
      return NextResponse.next();
    }

    // Verify token
    const user = await authService.verifyToken(request);

    if (!user) {
      // Redirect to login or return 401
      if (config.redirectUrl) {
        const loginUrl = new URL(config.redirectUrl, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      return authService.createAuthResponse(false, 'Authentication required');
    }

    // Add user to request headers for downstream consumption
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  };
}

/**
 * Verify token in API routes
 */
export async function verifyToken(request: any, authUrl: string = 'http://localhost:6800'): Promise<User | null> {
  const authService = new AuthService(authUrl);
  return authService.verifyToken(request);
}

/**
 * Require specific roles for API routes
 */
export function requireRole(requiredRoles: UserRole[], authUrl: string = 'http://localhost:6800') {
  return function decorator(handler: (request: any, user: User) => Promise<Response>) {
    return async function protectedHandler(request: any): Promise<Response> {
      const authService = new AuthService(authUrl);
      const user = await authService.verifyToken(request);

      if (!user) {
        return authService.createAuthResponse(false, 'Authentication required');
      }

      if (!authService.hasRole(user, requiredRoles)) {
        return authService.createAuthResponse(false, 'Insufficient permissions', 403);
      }

      return handler(request, user);
    };
  };
}

/**
 * Protect API route with authentication
 */
export function protectRoute(handler: (request: any, user: User) => Promise<Response>, authUrl: string = 'http://localhost:6800') {
  return async function protectedHandler(request: any): Promise<Response> {
    const authService = new AuthService(authUrl);
    const user = await authService.verifyToken(request);

    if (!user) {
      return authService.createAuthResponse(false, 'Authentication required');
    }

    return handler(request, user);
  };
}

/**
 * Extract user from request headers (set by middleware)
 */
export function getUserFromHeaders(request: any): Partial<User> | null {
  const userId = request.headers.get?.('x-user-id') || request.headers['x-user-id'];
  const userEmail = request.headers.get?.('x-user-email') || request.headers['x-user-email'];
  const userRole = request.headers.get?.('x-user-role') || request.headers['x-user-role'];

  if (!userId || !userEmail || !userRole) {
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole as UserRole,
  };
}

/**
 * Create service-to-service authentication header
 */
export function createServiceHeader(serviceKey: string): { [key: string]: string } {
  return {
    'Authorization': `Service ${serviceKey}`,
    'X-Service-Auth': 'true',
  };
}