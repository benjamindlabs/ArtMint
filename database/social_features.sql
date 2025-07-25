-- Social Features Database Schema for ArtMint NFT Marketplace
-- This file contains the database schema for social features including follows, likes, and comments

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- User Follows Table
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can't follow the same person twice
    UNIQUE(follower_id, following_id),
    
    -- Ensure a user can't follow themselves
    CHECK (follower_id != following_id)
);

-- NFT Likes Table
CREATE TABLE IF NOT EXISTS nft_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only like an NFT once
    UNIQUE(user_id, nft_id)
);

-- NFT Comments Table
CREATE TABLE IF NOT EXISTS nft_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
    parent_id UUID REFERENCES nft_comments(id) ON DELETE CASCADE, -- For replies
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Feed Table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'nft_created', 'nft_purchased', 'nft_sold', 'nft_liked', 
        'user_followed', 'comment_posted', 'collection_created'
    )),
    target_id UUID, -- ID of the target (NFT, User, Collection, etc.)
    target_type VARCHAR(50), -- Type of target (nft, user, collection)
    metadata JSONB, -- Additional data about the activity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add social counters to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nft_count INTEGER DEFAULT 0;

-- Add social counters to NFTs table
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_nft_likes_user ON nft_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_likes_nft ON nft_likes(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_comments_nft ON nft_comments(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_comments_user ON nft_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_comments_parent ON nft_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for nft_likes
CREATE POLICY "Users can view all likes" ON nft_likes FOR SELECT USING (true);
CREATE POLICY "Users can like NFTs" ON nft_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike NFTs" ON nft_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for nft_comments
CREATE POLICY "Users can view all comments" ON nft_comments FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Users can post comments" ON nft_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON nft_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON nft_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_activities
CREATE POLICY "Users can view activities of people they follow" ON user_activities FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IN (
        SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
    )
);
CREATE POLICY "Users can create their own activities" ON user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions to update counters

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment following count for follower
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        -- Increment follower count for followed user
        UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement following count for follower
        UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
        -- Decrement follower count for followed user
        UPDATE profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE nfts SET like_count = like_count + 1 WHERE id = NEW.nft_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE nfts SET like_count = like_count - 1 WHERE id = OLD.nft_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE nfts SET comment_count = comment_count + 1 WHERE id = NEW.nft_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE nfts SET comment_count = comment_count - 1 WHERE id = OLD.nft_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON user_follows;
CREATE TRIGGER trigger_update_follow_counts
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

DROP TRIGGER IF EXISTS trigger_update_like_counts ON nft_likes;
CREATE TRIGGER trigger_update_like_counts
    AFTER INSERT OR DELETE ON nft_likes
    FOR EACH ROW EXECUTE FUNCTION update_like_counts();

DROP TRIGGER IF EXISTS trigger_update_comment_counts ON nft_comments;
CREATE TRIGGER trigger_update_comment_counts
    AFTER INSERT OR DELETE ON nft_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Function to create activity feed entries
CREATE OR REPLACE FUNCTION create_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_target_id UUID DEFAULT NULL,
    p_target_type VARCHAR(50) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activities (user_id, activity_type, target_id, target_type, metadata)
    VALUES (p_user_id, p_activity_type, p_target_id, p_target_type, p_metadata)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all social tables
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
