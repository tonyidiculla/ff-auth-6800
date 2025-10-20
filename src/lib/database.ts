import { User, UserRole, CreateUserRequest } from '@/types';

// Mock database - in production, this would be replaced with actual database calls
let users: (User & { passwordHash: string })[] = [
  {
    id: '1',
    email: 'admin@furfield.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    emailVerified: true,
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/TDpMjcG6BJ/KZPXWS', // password: admin123
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

let refreshTokens: { token: string; userId: string; expiresAt: Date }[] = [];

export class UserService {
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    
    // Remove password hash from returned user
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create a new user
   */
  static async create(userData: CreateUserRequest & { passwordHash: string }): Promise<User> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser = {
      id: (users.length + 1).toString(),
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || UserRole.USER,
      isActive: true,
      emailVerified: false,
      passwordHash: userData.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUser);

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  }

  /**
   * Update user password
   */
  static async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    users[userIndex].passwordHash = passwordHash;
    users[userIndex].updatedAt = new Date();
    return true;
  }

  /**
   * Update last login time
   */
  static async updateLastLogin(id: string): Promise<void> {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      users[userIndex].lastLoginAt = new Date();
      users[userIndex].updatedAt = new Date();
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAll(): Promise<User[]> {
    return users.map(({ passwordHash, ...user }) => user);
  }

  /**
   * Delete user
   */
  static async delete(id: string): Promise<boolean> {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    users.splice(userIndex, 1);
    return true;
  }

  /**
   * Store refresh token
   */
  static async storeRefreshToken(token: string, userId: string, expiresAt: Date): Promise<void> {
    // Remove any existing refresh tokens for this user
    refreshTokens = refreshTokens.filter(rt => rt.userId !== userId);
    
    // Add new refresh token
    refreshTokens.push({ token, userId, expiresAt });
  }

  /**
   * Validate refresh token
   */
  static async validateRefreshToken(token: string): Promise<string | null> {
    const refreshToken = refreshTokens.find(rt => rt.token === token);
    
    if (!refreshToken) return null;
    if (refreshToken.expiresAt < new Date()) {
      // Remove expired token
      refreshTokens = refreshTokens.filter(rt => rt.token !== token);
      return null;
    }

    return refreshToken.userId;
  }

  /**
   * Remove refresh token
   */
  static async removeRefreshToken(token: string): Promise<void> {
    refreshTokens = refreshTokens.filter(rt => rt.token !== token);
  }

  /**
   * Remove all refresh tokens for a user
   */
  static async removeAllRefreshTokens(userId: string): Promise<void> {
    refreshTokens = refreshTokens.filter(rt => rt.userId !== userId);
  }
}