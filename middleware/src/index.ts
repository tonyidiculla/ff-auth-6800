export { AuthService } from './auth-service';
export { withAuth, verifyToken, requireRole, protectRoute, getUserFromHeaders, createServiceHeader } from './middleware';
export * from './types';

// Default export for convenience
export default {
  AuthService,
  withAuth,
  verifyToken,
  requireRole,
  protectRoute,
  getUserFromHeaders,
  createServiceHeader,
};