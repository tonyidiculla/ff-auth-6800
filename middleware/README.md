# Furfield Authentication Middleware
# Part of ff-auth-6800 authentication service

This package provides authentication middleware and utilities that can be used across all Furfield microservices to integrate with the central ff-auth-6800 service.

## Installation

```bash
# Install from local path during development
npm install ../ff-auth-6800/middleware

# Or if published to npm
npm install @furfield/auth-middleware
```

## Features

- JWT token validation
- User role verification
- Automatic token refresh
- Service-to-service authentication
- Request headers standardization
- Error handling

## Usage

### Next.js Middleware

```typescript
import { withAuth } from '@furfield/auth-middleware';

export default withAuth({
  authUrl: 'http://localhost:6800',
  protectedRoutes: ['/dashboard', '/admin'],
  publicRoutes: ['/login', '/register'],
});
```

### API Route Protection

```typescript
import { verifyToken, requireRole } from '@furfield/auth-middleware';

export async function GET(req: Request) {
  const user = await verifyToken(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Your protected API logic here
}
```

### Role-based Access

```typescript
import { requireRole } from '@furfield/auth-middleware';

export const GET = requireRole(['admin', 'manager'])(async (req, user) => {
  // Only admins and managers can access this
});
```