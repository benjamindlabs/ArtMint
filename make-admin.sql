-- SQL commands to fix admin setup and make shipfoward@gmail.com an admin
-- Run these commands in the Supabase SQL Editor

-- 1. Make sure the profiles table exists with the right structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  wallet_address TEXT,
  balance_eth NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE
);

-- 2. Add is_admin column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 3. Create items table to fix errors
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create balance_modifications table
CREATE TABLE IF NOT EXISTS balance_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  is_deposit BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_by UUID REFERENCES profiles(id)
);

-- 5. Make shipfoward@gmail.com an admin
-- First, find the user ID
SELECT id FROM auth.users WHERE email = 'shipfoward@gmail.com';

-- Then, update the profile (replace USER_ID with the actual ID from the previous query)
-- If you're running this in the SQL editor, you'll need to run this separately after getting the ID
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = (SELECT id FROM auth.users WHERE email = 'shipfoward@gmail.com');

-- 6. Make sure the user has a profile
INSERT INTO profiles (id, username, created_at, balance_eth, is_admin)
SELECT 
  id, 
  split_part(email, '@', 1), 
  NOW(), 
  0, 
  TRUE
FROM auth.users 
WHERE email = 'shipfoward@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET is_admin = TRUE;
