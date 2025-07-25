import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase, AuthUser, UserProfile, getUserProfile, createUserProfile } from '../utils/supabaseClient';
import { isValidEmail, isValidPassword, isValidUsername, sanitizeString, authRateLimiter } from '../utils/validation';
import { ensureUserProfile } from '../utils/profileUtils';

type AuthContextType = {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any, emailConfirmationSent: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to load user profile with fallback creation
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      // First try to get existing profile
      let userProfile = await getUserProfile(userId);

      // If profile doesn't exist, try to create it
      if (!userProfile) {
        console.log('Profile not found, attempting to create...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const result = await ensureUserProfile(userId, user.email);
          if (result.success && result.profile) {
            userProfile = result.profile;
            console.log('Profile created successfully');
          } else {
            console.error('Failed to create profile:', result.error);
          }
        }
      }

      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, []);

  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Input validation
      if (!isValidEmail(email)) {
        return { error: new Error('Please enter a valid email address') };
      }

      if (!password || password.length < 1) {
        return { error: new Error('Password is required') };
      }

      // Rate limiting
      const rateLimitKey = `signin_${email}`;
      if (!authRateLimiter.isAllowed(rateLimitKey)) {
        const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(rateLimitKey) / 1000 / 60);
        return { error: new Error(`Too many login attempts. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`) };
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeString(email.toLowerCase().trim());

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password
      });

      if (!error) {
        // Refresh session to ensure we have the latest user data
        await refreshSession();
      }

      return { error };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);

      // Input validation
      if (!isValidEmail(email)) {
        return { error: new Error('Please enter a valid email address'), emailConfirmationSent: false };
      }

      const passwordValidation = isValidPassword(password);
      if (!passwordValidation.isValid) {
        return {
          error: new Error(passwordValidation.errors.join('. ')),
          emailConfirmationSent: false
        };
      }

      const usernameValidation = isValidUsername(username);
      if (!usernameValidation.isValid) {
        return {
          error: new Error(usernameValidation.errors.join('. ')),
          emailConfirmationSent: false
        };
      }

      // Rate limiting
      const rateLimitKey = `signup_${email}`;
      if (!authRateLimiter.isAllowed(rateLimitKey)) {
        const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(rateLimitKey) / 1000 / 60);
        return {
          error: new Error(`Too many signup attempts. Please try again in ${remainingTime} minutes.`),
          emailConfirmationSent: false
        };
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeString(email.toLowerCase().trim());
      const sanitizedUsername = sanitizeString(username.trim());

      // Check if the username is already taken
      const { data: existingUsers, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', sanitizedUsername);

      if (usernameCheckError) {
        console.error('Error checking username:', usernameCheckError);
      } else if (existingUsers && existingUsers.length > 0) {
        return {
          error: new Error('Username is already taken. Please choose another username.'),
          emailConfirmationSent: false
        };
      }
      
      // Configure signup with email confirmation
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/signin?registered=true`,
          data: {
            username: sanitizedUsername
          }
        }
      });
      
      if (signUpError) {
        console.error('Signup error:', signUpError);
        return { error: signUpError, emailConfirmationSent: false };
      }

      if (!data?.user) {
        return { error: new Error('Failed to create user account'), emailConfirmationSent: false };
      }

      try {
        // Create a profile for the new user directly using SQL
        // This bypasses RLS policies that might be preventing profile creation
        const { error: profileError } = await supabase.rpc('create_user_profile', {
          user_id: data.user.id,
          user_username: sanitizedUsername,
          user_created_at: new Date().toISOString()
        });
        
        if (profileError) {
          console.error('Error creating profile with RPC:', profileError);
          
          // Fallback to direct insert
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              username: sanitizedUsername,
              created_at: new Date().toISOString(),
              balance_eth: 0
            }]);
            
          if (insertError) {
            console.error('Error creating profile with direct insert:', insertError);
          }
        }
      } catch (profileError) {
        console.error('Unexpected error creating profile:', profileError);
      }

      // Check if email confirmation is required
      const emailConfirmationSent = data.user.identities && data.user.identities.length === 0;
      
      // Return success
      return { error: null, emailConfirmationSent: true };
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      return { error, emailConfirmationSent: false };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
