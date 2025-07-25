-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create a policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  ));

-- Create a policy to allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  ));

-- Create a table to track balance modifications by admins
CREATE TABLE IF NOT EXISTS balance_modifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on balance_modifications
ALTER TABLE balance_modifications ENABLE ROW LEVEL SECURITY;

-- Create policies for balance_modifications
CREATE POLICY "Admins can insert balance modifications"
  ON balance_modifications FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can view all balance modifications"
  ON balance_modifications FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  ));

CREATE POLICY "Users can view their own balance modifications"
  ON balance_modifications FOR SELECT
  USING (auth.uid() = user_id);
