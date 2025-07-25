import { supabase } from './supabaseClient';

/**
 * Checks if the current user has admin privileges
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No session found, user is not authenticated');
      return false;
    }

    // Special case for the designated admin email - always grant admin access
    if (session.user.email === 'shipfoward@gmail.com') {
      console.log('Admin access granted to designated admin email');
      return true;
    }

    // For other users, we need to check the database
    // But first, let's try to avoid the RLS infinite recursion
    try {
      // Use a direct connection with service role key if available
      // Otherwise, fall back to a simple check
      console.log('Checking admin status for user:', session.user.id);
      
      // Simple approach: check if the user exists in the profiles table
      // and if they have the is_admin flag set to true
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return !!data?.is_admin;
    } catch (error) {
      console.error('Error in admin check:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in isUserAdmin:', error);
    return false;
  }
}

/**
 * Redirects non-admin users away from admin pages
 * @param router Next.js router object
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise
 */
export async function requireAdmin(router: any): Promise<boolean> {
  const isAdmin = await isUserAdmin();
  
  if (!isAdmin) {
    router.push('/dashboard');
  }
  
  return isAdmin;
}
