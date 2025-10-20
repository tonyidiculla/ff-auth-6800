export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  VETERINARIAN = 'veterinarian',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
  MANAGER = 'manager',
  STAFF = 'staff',
  USER = 'user'
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthConfig {
  authUrl: string;
  protectedRoutes?: string[];
  publicRoutes?: string[];
  redirectUrl?: string;
  tokenHeader?: string;
  refreshThreshold?: number; // Minutes before expiry to refresh
}

export interface VerifyTokenResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    role: UserRole;
    valid: boolean;
  };
  error?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}