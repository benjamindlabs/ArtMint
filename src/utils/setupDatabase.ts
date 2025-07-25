import { supabase } from './supabaseClient';

interface SetupDatabaseResult {
  success: boolean;
  missingTables: string[];
  createdTables: string[];
  errors: Record<string, string>;
  sqlStatements: Record<string, string>;
}

/**
 * Checks if required database tables exist and returns a list of missing tables
 * This function should be called during application initialization
 */
export async function setupDatabase(): Promise<SetupDatabaseResult> {
  const requiredTables = ['profiles', 'balance_modifications', 'items', 'collections'];
  const missing: string[] = [];
  const created: string[] = [];
  const errors: Record<string, string> = {};
  const sqlStatements: Record<string, string> = {};

  // SQL statements for each table
  sqlStatements['profiles'] = `-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  balance_eth DECIMAL DEFAULT 0,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read public profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Special policy for designated admin - using is_admin flag instead of hardcoded email
CREATE POLICY "Designated admin can do anything"
  ON profiles
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Admin policies - using direct check instead of subquery to avoid recursion
CREATE POLICY "Admin users can select any profile"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admin users can update any profile"
  ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admin users can insert any profile"
  ON profiles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));`;

  sqlStatements['balance_modifications'] = `-- Create balance_modifications table
CREATE TABLE IF NOT EXISTS balance_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL NOT NULL,
  previous_balance DECIMAL NOT NULL,
  new_balance DECIMAL NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE balance_modifications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own balance modifications
CREATE POLICY "Users can view their own balance modifications"
  ON balance_modifications FOR SELECT
  USING (auth.uid() = user_id);

-- Special policy for designated admin - using is_admin flag instead of hardcoded email
CREATE POLICY "Designated admin can do anything with balance_modifications"
  ON balance_modifications
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Admin policies - using direct check instead of subquery to avoid recursion
CREATE POLICY "Admin users can view all balance modifications"
  ON balance_modifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admin users can insert balance modifications"
  ON balance_modifications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));`;

  sqlStatements['items'] = `-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  image_url TEXT,
  price DECIMAL,
  is_for_sale BOOLEAN DEFAULT FALSE,
  token_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own items"
  ON items FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admin users can update any item"
  ON items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can insert their own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = creator_id);`;

  sqlStatements['collections'] = `-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_url TEXT,
  banner_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Collections are viewable by everyone"
  ON collections FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Admin users can update any collection"
  ON collections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can insert their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = creator_id);`;

  // Check which tables exist
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') { // Table doesn't exist
        missing.push(table);
      }
    } catch (error) {
      console.error(`Error checking table ${table}:`, error);
      missing.push(table);
    }
  }

  // Return early if no tables need to be created
  if (missing.length === 0) {
    return {
      success: true,
      missingTables: [],
      createdTables: [],
      errors: {},
      sqlStatements
    };
  }

  // We're no longer automatically creating tables
  // Instead, we're just returning the SQL statements for the missing tables
  return {
    success: false,
    missingTables: missing,
    createdTables: created,
    errors: errors,
    sqlStatements
  };
}

/**
 * Makes a user an admin
 */
export async function makeUserAdmin(userId: string): Promise<boolean> {
  try {
    // First check if the user exists in profiles
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('id', userId)
      .single();
    
    if (checkError) {
      // User doesn't exist in profiles, create the profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: `admin_${userId.substring(0, 8)}`,
          balance_eth: 0,
          is_admin: true,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating admin profile:', insertError);
        return false;
      }
    } else if (!existingProfile.is_admin) {
      // User exists but is not admin, update to make them admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating admin status:', updateError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in makeUserAdmin:', error);
    return false;
  }
}

/**
 * Creates a user profile directly
 */
export async function createUserProfile(userId: string, username: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username,
        balance_eth: 0,
        is_admin: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating user profile:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return false;
  }
}
