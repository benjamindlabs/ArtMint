import { createClient } from '@supabase/supabase-js';
import { env, validateEnvironment } from './env';

// Validate environment on import
const envValidation = validateEnvironment();
if (!envValidation.isValid && typeof window === 'undefined') {
  console.error('Supabase configuration errors:', envValidation.errors);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate Supabase URL
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Create a mock client for development if credentials are not provided
const createMockClient = () => {
  console.warn('Using mock Supabase client. Please set up your Supabase credentials.');
  
  // Mock user data for development
  const mockUser = {
    id: 'mock-user-id',
    email: 'user@example.com',
  };

  const mockProfile = {
    id: 'mock-user-id',
    username: 'mockuser',
    avatar_url: 'https://via.placeholder.com/150',
    wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
    balance_eth: 1.5,
    created_at: new Date().toISOString(),
  };

  // Track authentication state
  let isAuthenticated = false;
  
  return {
    auth: {
      getUser: async () => ({ 
        data: { user: isAuthenticated ? mockUser : null }, 
        error: null 
      }),
      getSession: async () => ({ 
        data: { session: isAuthenticated ? { user: mockUser } : null }, 
        error: null 
      }),
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        // Simple mock validation
        if (email && password) {
          isAuthenticated = true;
          return { data: { user: mockUser, session: {} }, error: null };
        }
        return { data: null, error: { message: 'Invalid login credentials' } };
      },
      signUp: async ({ email, password }: { email: string; password: string }) => {
        if (email && password) {
          return { data: { user: mockUser }, error: null };
        }
        return { data: null, error: { message: 'Invalid signup data' } };
      },
      signOut: async () => {
        isAuthenticated = false;
        return { error: null };
      },
      onAuthStateChange: (callback: any) => {
        // Mock subscription
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from: (table: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (table === 'profiles' && column === 'id' && value === mockUser.id) {
              return { data: mockProfile, error: null };
            }
            return { data: null, error: null };
          },
          select: async () => ({ data: [], error: null }),
        }),
        select: async () => {
          if (table === 'profiles') {
            return { data: [mockProfile], error: null };
          }
          return { data: [], error: null };
        },
      }),
      insert: (values: any) => ({
        select: async () => {
          if (table === 'profiles') {
            return { data: { ...mockProfile, ...values }, error: null };
          }
          return { data: null, error: null };
        },
      }),
      update: (values: any) => ({
        eq: (column: string, value: any) => ({
          select: async () => {
            if (table === 'profiles' && column === 'id' && value === mockUser.id) {
              return { data: { ...mockProfile, ...values }, error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),
    }),
  };
};

// Create the Supabase client, or use a mock for development
export const supabase = (() => {
  // Check if we have valid Supabase credentials
  if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
    try {
      // Create client with better timeout and retry options
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'nftmarket-auth-token',
          storage: {
            getItem: (key) => {
              try {
                if (typeof window !== 'undefined') {
                  return localStorage.getItem(key);
                }
                return null;
              } catch (error) {
                console.error('Error accessing localStorage:', error);
                return null;
              }
            },
            setItem: (key, value) => {
              try {
                if (typeof window !== 'undefined') {
                  localStorage.setItem(key, value);
                }
              } catch (error) {
                console.error('Error writing to localStorage:', error);
              }
            },
            removeItem: (key) => {
              try {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(key);
                }
              } catch (error) {
                console.error('Error removing from localStorage:', error);
              }
            }
          }
        },
        global: {
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              // Increase timeout to 30 seconds
              signal: AbortSignal.timeout(30000)
            });
          }
        }
      });
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return createMockClient() as any;
    }
  }
  
  // Use mock client if credentials are missing or invalid
  console.warn('Using mock Supabase client - missing or invalid credentials');
  return createMockClient() as any;
})();

export type UserProfile = {
  id: string;
  username: string;
  avatar_url?: string;
  wallet_address?: string;
  balance_eth?: number;
  created_at: string;
  bio?: string;
  website?: string;
  twitter?: string;
};

export type AuthUser = {
  id: string;
  email?: string;
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

export const updateUserBalance = async (userId: string, amount: number, isDeposit: boolean): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Get current profile
    const profile = await getUserProfile(userId);
    if (!profile) return false;
    
    const currentBalance = profile.balance_eth || 0;
    const newBalance = isDeposit ? currentBalance + amount : currentBalance - amount;
    
    // Ensure balance doesn't go negative
    if (newBalance < 0) return false;
    
    const { error } = await supabase
      .from('profiles')
      .update({ balance_eth: newBalance })
      .eq('id', userId);
    
    return !error;
  } catch (error) {
    console.error('Error updating user balance:', error);
    return false;
  }
};

// Function to create a profile for a new user
export const createUserProfile = async (userId: string, username: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  
  try {
    // Check if profile already exists
    const existingProfile = await getUserProfile(userId);
    if (existingProfile) return existingProfile;
    
    // Create new profile
    const newProfile: Partial<UserProfile> = {
      id: userId,
      username,
      created_at: new Date().toISOString(),
      balance_eth: 0,
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};
