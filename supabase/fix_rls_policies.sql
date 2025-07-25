-- Fix RLS policies to avoid infinite recursion

-- First, disable RLS temporarily to allow fixing the policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE balance_modifications DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing infinite recursion
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Designated admin can do anything" ON profiles;
DROP POLICY IF EXISTS "Admin users can select any profile" ON profiles;

DROP POLICY IF EXISTS "Admin users can view all balance modifications" ON balance_modifications;
DROP POLICY IF EXISTS "Admin users can insert balance modifications" ON balance_modifications;
DROP POLICY IF EXISTS "Designated admin can do anything with balance_modifications" ON balance_modifications;

-- Create simple policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Special policy for designated admin email
CREATE POLICY "Designated admin can do anything with profiles"
  ON profiles
  USING (auth.jwt() ->> 'email' = 'shipfoward@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'shipfoward@gmail.com');

-- Create simple policies for balance_modifications table
CREATE POLICY "Users can view their own balance modifications"
  ON balance_modifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Designated admin can do anything with balance_modifications"
  ON balance_modifications
  USING (auth.jwt() ->> 'email' = 'shipfoward@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'shipfoward@gmail.com');

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_modifications ENABLE ROW LEVEL SECURITY;

-- Insert or update the admin user
INSERT INTO profiles (id, username, is_admin, balance_eth, created_at)
SELECT 
  auth.uid(), 
  SPLIT_PART(auth.email(), '@', 1), 
  TRUE, 
  0, 
  NOW()
FROM auth.users
WHERE email = 'shipfoward@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_admin = TRUE;
