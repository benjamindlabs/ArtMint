/**
 * Profile utility functions for handling user profile creation and management
 */

import { supabase, UserProfile } from './supabaseClient';

export interface ProfileCreationResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

/**
 * Create a user profile manually using the database function
 */
export const createUserProfile = async (
  userId: string,
  email: string,
  username?: string
): Promise<ProfileCreationResult> => {
  try {
    // Use the database function to create profile (bypasses RLS issues)
    const { data, error } = await supabase.rpc('create_profile_for_user', {
      user_id: userId,
      user_email: email,
      user_username: username
    });

    if (error) {
      console.error('Error creating profile:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // The function returns the profile data
    return {
      success: true,
      profile: data
    };
  } catch (error: any) {
    console.error('Error in createUserProfile:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Ensure user profile exists, create if missing
 */
export const ensureUserProfile = async (userId: string, email: string): Promise<ProfileCreationResult> => {
  try {
    // First try to get existing profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile && !error) {
      return {
        success: true,
        profile
      };
    }

    // If profile doesn't exist, create it
    if (error?.code === 'PGRST116') { // No rows returned
      return await createUserProfile(userId, email);
    }

    // Other error occurred
    return {
      success: false,
      error: error?.message || 'Unknown error occurred'
    };
  } catch (error: any) {
    console.error('Error in ensureUserProfile:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Test database connectivity
 */
export const testDatabaseConnection = async (): Promise<{
  connected: boolean;
  tablesExist: {
    profiles: boolean;
    items: boolean;
    collections: boolean;
  };
  error?: string;
}> => {
  try {
    const result = {
      connected: false,
      tablesExist: {
        profiles: false,
        items: false,
        collections: false
      }
    };

    // Test profiles table
    try {
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (!profilesError) {
        result.tablesExist.profiles = true;
      }
    } catch (error) {
      console.log('Profiles table test failed:', error);
    }

    // Test items table
    try {
      const { error: itemsError } = await supabase
        .from('items')
        .select('id')
        .limit(1);
      
      if (!itemsError) {
        result.tablesExist.items = true;
      }
    } catch (error) {
      console.log('Items table test failed:', error);
    }

    // Test collections table
    try {
      const { error: collectionsError } = await supabase
        .from('collections')
        .select('id')
        .limit(1);
      
      if (!collectionsError) {
        result.tablesExist.collections = true;
      }
    } catch (error) {
      console.log('Collections table test failed:', error);
    }

    // If at least one table exists, consider connection successful
    result.connected = Object.values(result.tablesExist).some(exists => exists);

    return result;
  } catch (error: any) {
    return {
      connected: false,
      tablesExist: {
        profiles: false,
        items: false,
        collections: false
      },
      error: error.message
    };
  }
};

/**
 * Get user profile with retry logic
 */
export const getUserProfileWithRetry = async (
  userId: string, 
  maxRetries: number = 3
): Promise<UserProfile | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        return data;
      }

      if (error && error.code !== 'PGRST116') {
        console.error(`Attempt ${attempt} failed:`, error);
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed with exception:`, error);
    }
  }

  return null;
};

/**
 * Validate profile data
 */
export const validateProfileData = (profile: Partial<UserProfile>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!profile.id) {
    errors.push('Profile ID is required');
  }

  if (!profile.username) {
    errors.push('Username is required');
  } else if (profile.username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (profile.username.length > 30) {
    errors.push('Username must be less than 30 characters long');
  }

  if (profile.bio && profile.bio.length > 500) {
    errors.push('Bio must be less than 500 characters long');
  }

  if (profile.website && !isValidUrl(profile.website)) {
    errors.push('Website must be a valid URL');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper function to validate URLs
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default {
  createUserProfile,
  ensureUserProfile,
  testDatabaseConnection,
  getUserProfileWithRetry,
  validateProfileData
};
