import { getSupabaseClient } from './client';

export const signInWithMagicLink = async (email: string, redirectUrl: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error('Error signing in with magic link:', error);
    return { error };
  }

  return { error: null };
};

export const signOut = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
  }

  return { error };
};

export const getUser = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return { user: null, error };
  }

  return { user: data.user, error: null };
};

export const getSession = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return { session: null, error };
  }

  return { session: data.session, error: null };
}; 