-- Create RPC functions to handle admin operations safely without infinite recursion

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT p.is_admin INTO is_admin
  FROM profiles p
  WHERE p.id = user_id;
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get a profile by ID safely
CREATE OR REPLACE FUNCTION get_profile_by_id(user_id UUID)
RETURNS SETOF profiles
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create an admin profile safely
CREATE OR REPLACE FUNCTION create_admin_profile(
  admin_id UUID,
  admin_email TEXT,
  admin_username TEXT
)
RETURNS VOID
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  INSERT INTO profiles (id, username, is_admin, balance_eth, created_at)
  VALUES (
    admin_id,
    admin_username,
    TRUE,
    0,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET is_admin = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Designated admin can do anything" ON profiles;

-- Create better policies that avoid recursion
CREATE POLICY "Admin users can view all profiles"
  ON profiles FOR SELECT
  USING (
    (SELECT is_user_admin(auth.uid())) = TRUE
    OR auth.jwt() ->> 'email' = 'shipfoward@gmail.com'
  );

CREATE POLICY "Admin users can update any profile"
  ON profiles FOR UPDATE
  USING (
    (SELECT is_user_admin(auth.uid())) = TRUE
    OR auth.jwt() ->> 'email' = 'shipfoward@gmail.com'
  );

CREATE POLICY "Admin users can insert any profile"
  ON profiles FOR INSERT
  WITH CHECK (
    (SELECT is_user_admin(auth.uid())) = TRUE
    OR auth.jwt() ->> 'email' = 'shipfoward@gmail.com'
    OR auth.uid() = id
  );

-- Fix RLS policies for balance_modifications table
DROP POLICY IF EXISTS "Admin users can view all balance modifications" ON balance_modifications;
DROP POLICY IF EXISTS "Admin users can insert balance modifications" ON balance_modifications;
DROP POLICY IF EXISTS "Designated admin can do anything with balance_modifications" ON balance_modifications;

-- Create better policies that avoid recursion
CREATE POLICY "Admin users can view all balance modifications"
  ON balance_modifications FOR SELECT
  USING (
    (SELECT is_user_admin(auth.uid())) = TRUE
    OR auth.jwt() ->> 'email' = 'shipfoward@gmail.com'
  );

CREATE POLICY "Admin users can insert balance modifications"
  ON balance_modifications FOR INSERT
  WITH CHECK (
    (SELECT is_user_admin(auth.uid())) = TRUE
    OR auth.jwt() ->> 'email' = 'shipfoward@gmail.com'
  );
