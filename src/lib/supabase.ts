import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SECRET_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for frontend usage (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend/API usage (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'  // Explicitly use public schema, not master_data
  }
});

// Database types for auth
export interface DatabaseUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface DatabaseRefreshToken {
  id: string;
  token: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}
