import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!AuthService.isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Use Supabase Auth to sign in
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError?.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = authData.user;

    console.log('🔑 Auth user ID:', user.id, 'Email:', user.email);

    // Create a fresh Supabase client with explicit public schema
    // The imported supabaseAdmin is somehow caching master_data schema
    const freshSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_SUPABASE_SECRET_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    );

    // Fetch profile and role from database
    // First get the profile without joins
    const { data: profile, error: profileError } = await freshSupabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    console.log('🔍 Profile query result:', {
      found: !!profile,
      email: profile?.email,
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      profile_id: profile?.id,
      user_id: profile?.user_id,
      avatar_storage: profile?.avatar_storage,
      avatar_storage_type: typeof profile?.avatar_storage,
      error: profileError?.message
    });

    // Get role assignment separately using user_platform_id
    let roleData = null;
    if (profile?.user_platform_id) {
      const { data: roleAssignment } = await freshSupabase
        .from('user_to_role_assignment')
        .select(`
          platform_roles!user_to_role_assignment_platform_role_id_fkey(role_name, display_name, privilege_level)
        `)
        .eq('user_platform_id', profile.user_platform_id)
        .single();
      roleData = roleAssignment;
      console.log('🔍 Role assignment query:', {
        user_platform_id: profile.user_platform_id,
        found: !!roleAssignment,
        role: roleAssignment?.platform_roles
      });
    }
    
    // Get avatar URL from storage if avatar_storage path exists
    let avatarUrl = null;
    
    if (profile?.avatar_storage && typeof profile.avatar_storage === 'string') {
      const { data: urlData } = supabaseAdmin
        .storage
        .from('avatars')
        .getPublicUrl(profile.avatar_storage);
      avatarUrl = urlData.publicUrl;
      console.log('✅ Avatar URL generated:', avatarUrl);
    } else {
      console.log('⚠️  No avatar_storage:', profile?.avatar_storage, 'Type:', typeof profile?.avatar_storage);
    }

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // Get role display name from separate query, fallback to 'user'
    const platformRole = Array.isArray(roleData?.platform_roles) 
      ? roleData.platform_roles[0] 
      : roleData?.platform_roles;
    const role = platformRole?.display_name || platformRole?.role_name || 'user';
    const firstName = profile?.first_name || user.user_metadata?.firstName || user.user_metadata?.first_name || '';
    const lastName = profile?.last_name || user.user_metadata?.lastName || user.user_metadata?.last_name || '';

    // Generate our own JWT token for consistency
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email!,
      role: role,
    });

    // Map Supabase user to our format
    const userResponse = {
      id: user.id,
      email: user.email!,
      firstName: firstName,
      lastName: lastName,
      role: role,
      isActive: true,
      emailVerified: user.email_confirmed_at ? true : false,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
      lastLoginAt: user.last_sign_in_at,
      avatarUrl: avatarUrl || undefined,
    };
    
    console.log('📤 Sending user response with avatarUrl:', userResponse.avatarUrl);

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      token,
      user: userResponse,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    // Set cookies that work across all localhost ports for SSO
    // Using sameSite: 'lax' and domain: 'localhost' to enable cross-port cookie sharing
    response.cookies.set('furfield_token', token, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: false, // Allow JavaScript access for client-side apps
      sameSite: 'lax', // Allow cross-port navigation on localhost
      secure: process.env.NODE_ENV === 'production', // Only secure in production
    });

    // Also set user info cookie for client-side access
    response.cookies.set('furfield_user', JSON.stringify(userResponse), {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    console.log('✓ Login successful, cookies set for SSO');

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}