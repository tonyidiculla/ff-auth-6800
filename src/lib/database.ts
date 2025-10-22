import { User, UserRole, CreateUserRequest } from '@/types';
import { supabaseAdmin } from './supabase';

export class UserService {
  /**
   * Find user by email using Supabase Auth
   */
  static async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    // Use Supabase Auth to get user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError || !authData) {
      console.error('Error fetching users from Supabase Auth:', authError);
      return null;
    }

    const authUser = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!authUser) {
      return null;
    }

    // Get user profile and role from public schema
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single();
    
    // Get role assignment separately using user_platform_id
    let roleData = null;
    if (profileData?.user_platform_id) {
      const { data: roleAssignment, error: roleError } = await supabaseAdmin
        .from('user_to_role_assignment')
        .select(`
          platform_roles(role_name, display_name, privilege_level)
        `)
        .eq('user_platform_id', profileData.user_platform_id)
        .single();
      
      if (roleError) {
        console.error('🔴 findByEmail - Role query error:', roleError);
      }
      
      roleData = roleAssignment;
    }
    
    // Get avatar URL from storage if avatar_storage path exists
    let avatarUrl = null;
    if (profileData?.avatar_storage && typeof profileData.avatar_storage === 'string') {
      const { data: urlData } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(profileData.avatar_storage);
      avatarUrl = urlData.publicUrl;
    }

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Extract role display name from the separate query
    const platformRole = Array.isArray(roleData?.platform_roles) 
      ? roleData.platform_roles[0] 
      : roleData?.platform_roles;
    const role = platformRole?.display_name || platformRole?.role_name || 'User';

    // Map Supabase Auth user to our User type
    return {
      id: authUser.id,
      email: authUser.email!,
      firstName: profileData?.first_name || authUser.user_metadata?.firstName || authUser.user_metadata?.first_name || '',
      lastName: profileData?.last_name || authUser.user_metadata?.lastName || authUser.user_metadata?.last_name || '',
      role: role as UserRole,
      isActive: profileData?.is_active ?? true,
      emailVerified: authUser.email_confirmed_at ? true : false,
      passwordHash: '', // Supabase handles password hashing internally
      createdAt: new Date(authUser.created_at),
      updatedAt: new Date(authUser.updated_at || authUser.created_at),
      lastLoginAt: authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : undefined,
      avatarUrl: avatarUrl || undefined,
    };
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    try {
      // Use Supabase Auth to get user by ID
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
      
      if (authError || !authData.user) {
        console.error('Error fetching user from Supabase Auth:', authError);
        return null;
      }

      const authUser = authData.user;

      // Get user profile from public schema
      const { data: profileData, error: profileError} = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();
      
      // Get role assignment separately using user_platform_id
      let roleData = null;
      if (profileData?.user_platform_id) {
        // Try without explicit FK name first
        const { data: roleAssignment, error: roleError } = await supabaseAdmin
          .from('user_to_role_assignment')
          .select(`
            platform_roles(role_name, display_name, privilege_level)
          `)
          .eq('user_platform_id', profileData.user_platform_id)
          .single();
        
        if (roleError) {
          console.error('🔴 findById - Role query error:', roleError);
        }
        
        roleData = roleAssignment;
        console.log('🔍 findById - Role data:', {
          user_platform_id: profileData.user_platform_id,
          roleData,
          roleAssignment
        });
      } else {
        console.log('⚠️  findById - No user_platform_id in profile');
      }
      
      // Get avatar URL from storage if avatar_storage path exists
      let avatarUrl = null;
      if (profileData?.avatar_storage && typeof profileData.avatar_storage === 'string') {
        const { data: urlData } = supabaseAdmin
          .storage
          .from('avatars')
          .getPublicUrl(profileData.avatar_storage);
        avatarUrl = urlData.publicUrl;
      }

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Extract role display name from the separate query
      const platformRole = Array.isArray(roleData?.platform_roles) 
        ? roleData.platform_roles[0] 
        : roleData?.platform_roles;
      const role = platformRole?.display_name || platformRole?.role_name || 'User';

      // Map Supabase Auth user to our User type
      return {
        id: authUser.id,
        avatarUrl: avatarUrl || undefined,
        email: authUser.email!,
        firstName: profileData?.first_name || authUser.user_metadata?.firstName || authUser.user_metadata?.first_name || '',
        lastName: profileData?.last_name || authUser.user_metadata?.lastName || authUser.user_metadata?.last_name || '',
        role: role,
        isActive: profileData?.is_active ?? true,
        emailVerified: authUser.email_confirmed_at ? true : false,
        createdAt: new Date(authUser.created_at),
        updatedAt: new Date(authUser.updated_at || authUser.created_at),
        lastLoginAt: authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : undefined,
      };
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
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