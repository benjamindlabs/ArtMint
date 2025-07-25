-- ArtMint NFT Marketplace Database Setup
-- Run this SQL in your Supabase SQL Editor to set up the required tables

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  balance_eth DECIMAL DEFAULT 0,
  wallet_address TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  twitter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
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

-- Admin policies
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
  ));

-- Create collections table
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

-- Set up Row Level Security (RLS) for collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
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
  WITH CHECK (auth.uid() = creator_id);

-- Create items (NFTs) table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  image_url TEXT,
  metadata_url TEXT,
  price DECIMAL,
  currency TEXT DEFAULT 'ETH',
  is_for_sale BOOLEAN DEFAULT FALSE,
  token_id TEXT,
  contract_address TEXT,
  metadata JSONB,
  attributes JSONB,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS) for items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for items
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
  WITH CHECK (auth.uid() = creator_id);

-- Create balance_modifications table for tracking balance changes
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

-- Set up Row Level Security (RLS) for balance_modifications
ALTER TABLE balance_modifications ENABLE ROW LEVEL SECURITY;

-- Create policies for balance_modifications
-- Allow users to view their own balance modifications
CREATE POLICY "Users can view their own balance modifications"
  ON balance_modifications FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policies for balance_modifications
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
  ));

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manually create user profile (for signup process)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_username TEXT,
  user_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (user_id, user_username, user_created_at)
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    created_at = EXCLUDED.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_creator_id ON items(creator_id);
CREATE INDEX IF NOT EXISTS idx_items_collection_id ON items(collection_id);
CREATE INDEX IF NOT EXISTS idx_items_is_for_sale ON items(is_for_sale);
CREATE INDEX IF NOT EXISTS idx_collections_creator_id ON collections(creator_id);
CREATE INDEX IF NOT EXISTS idx_balance_modifications_user_id ON balance_modifications(user_id);

-- Insert some sample data (optional)
-- You can uncomment these lines to add sample collections and items

/*
-- Sample collections
INSERT INTO collections (name, description, creator_id, image_url, is_verified) VALUES
('Digital Art Collection', 'A curated collection of digital artworks', NULL, 'https://via.placeholder.com/400', true),
('Photography Collection', 'Professional photography NFTs', NULL, 'https://via.placeholder.com/400', true),
('Abstract Art', 'Modern abstract digital art', NULL, 'https://via.placeholder.com/400', false);

-- Sample items (NFTs)
INSERT INTO items (name, description, image_url, price, currency, is_for_sale, metadata) VALUES
('Digital Sunset', 'A beautiful digital sunset artwork', 'https://picsum.photos/400/400?random=1', 0.5, 'ETH', true, '{"artist": "Digital Artist", "year": "2024"}'),
('Abstract Waves', 'Flowing abstract wave patterns', 'https://picsum.photos/400/400?random=2', 0.3, 'ETH', true, '{"style": "Abstract", "medium": "Digital"}'),
('Neon City', 'Cyberpunk cityscape at night', 'https://picsum.photos/400/400?random=3', 0.8, 'ETH', true, '{"theme": "Cyberpunk", "mood": "Dark"}'),
('Geometric Dreams', 'Colorful geometric patterns', 'https://picsum.photos/400/400?random=4', 0.2, 'ETH', true, '{"style": "Geometric", "colors": "Vibrant"}');
*/

-- Success message
SELECT 'Database setup completed successfully! All tables and policies have been created.' as message;
