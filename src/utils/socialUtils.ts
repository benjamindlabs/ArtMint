/**
 * Social Features Utilities for ArtMint NFT Marketplace
 * Handles follows, likes, comments, and activity feeds
 */

import { supabase } from './supabaseClient';

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: {
    username: string;
    avatar_url?: string;
  };
  following?: {
    username: string;
    avatar_url?: string;
  };
}

export interface NFTLike {
  id: string;
  user_id: string;
  nft_id: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export interface NFTComment {
  id: string;
  nft_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
  replies?: NFTComment[];
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'nft_created' | 'nft_purchased' | 'nft_sold' | 'nft_liked' | 'user_followed' | 'comment_posted' | 'collection_created';
  target_id?: string;
  target_type?: string;
  metadata?: any;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export class SocialUtils {
  // Follow/Unfollow Functions
  static async followUser(followerId: string, followingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (followerId === followingId) {
        return { success: false, error: 'Cannot follow yourself' };
      }

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Already following this user' };
        }
        throw error;
      }

      // Create activity
      await supabase.rpc('create_activity', {
        p_user_id: followerId,
        p_activity_type: 'user_followed',
        p_target_id: followingId,
        p_target_type: 'user'
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error following user:', error);
      return { success: false, error: error.message };
    }
  }

  static async unfollowUser(followerId: string, followingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      return { success: false, error: error.message };
    }
  }

  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  static async getFollowers(userId: string, limit: number = 20): Promise<{ data: UserFollow[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:profiles!user_follows_follower_id_fkey(username, avatar_url)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data || [] };
    } catch (error: any) {
      console.error('Error getting followers:', error);
      return { data: [], error: error.message };
    }
  }

  static async getFollowing(userId: string, limit: number = 20): Promise<{ data: UserFollow[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          following:profiles!user_follows_following_id_fkey(username, avatar_url)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data || [] };
    } catch (error: any) {
      console.error('Error getting following:', error);
      return { data: [], error: error.message };
    }
  }

  // Like/Unlike Functions
  static async likeNFT(userId: string, nftId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('nft_likes')
        .insert({
          user_id: userId,
          nft_id: nftId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Already liked this NFT' };
        }
        throw error;
      }

      // Create activity
      await supabase.rpc('create_activity', {
        p_user_id: userId,
        p_activity_type: 'nft_liked',
        p_target_id: nftId,
        p_target_type: 'nft'
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error liking NFT:', error);
      return { success: false, error: error.message };
    }
  }

  static async unlikeNFT(userId: string, nftId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('nft_likes')
        .delete()
        .eq('user_id', userId)
        .eq('nft_id', nftId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error unliking NFT:', error);
      return { success: false, error: error.message };
    }
  }

  static async hasLikedNFT(userId: string, nftId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('nft_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('nft_id', nftId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  static async getNFTLikes(nftId: string, limit: number = 20): Promise<{ data: NFTLike[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('nft_likes')
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .eq('nft_id', nftId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data || [] };
    } catch (error: any) {
      console.error('Error getting NFT likes:', error);
      return { data: [], error: error.message };
    }
  }

  // Comment Functions
  static async addComment(userId: string, nftId: string, content: string, parentId?: string): Promise<{ success: boolean; data?: NFTComment; error?: string }> {
    try {
      if (!content.trim() || content.length > 1000) {
        return { success: false, error: 'Comment must be between 1 and 1000 characters' };
      }

      const { data, error } = await supabase
        .from('nft_comments')
        .insert({
          user_id: userId,
          nft_id: nftId,
          content: content.trim(),
          parent_id: parentId
        })
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Create activity
      await supabase.rpc('create_activity', {
        p_user_id: userId,
        p_activity_type: 'comment_posted',
        p_target_id: nftId,
        p_target_type: 'nft',
        p_metadata: { comment_id: data.id }
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateComment(commentId: string, userId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!content.trim() || content.length > 1000) {
        return { success: false, error: 'Comment must be between 1 and 1000 characters' };
      }

      const { error } = await supabase
        .from('nft_comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating comment:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteComment(commentId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('nft_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  }

  static async getNFTComments(nftId: string, limit: number = 20): Promise<{ data: NFTComment[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('nft_comments')
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .eq('nft_id', nftId)
        .is('parent_id', null) // Only top-level comments
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('nft_comments')
            .select(`
              *,
              user:profiles(username, avatar_url)
            `)
            .eq('parent_id', comment.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });

          return { ...comment, replies: replies || [] };
        })
      );

      return { data: commentsWithReplies };
    } catch (error: any) {
      console.error('Error getting NFT comments:', error);
      return { data: [], error: error.message };
    }
  }

  // Activity Feed Functions
  static async getUserActivityFeed(userId: string, limit: number = 20): Promise<{ data: UserActivity[]; error?: string }> {
    try {
      // Get activities from users that the current user follows
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .in('user_id', [
          userId, // Include user's own activities
          // Add followed users' activities via a separate query
        ])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data || [] };
    } catch (error: any) {
      console.error('Error getting activity feed:', error);
      return { data: [], error: error.message };
    }
  }

  // Increment view count for NFT
  static async incrementNFTViews(nftId: string): Promise<void> {
    try {
      await supabase
        .from('nfts')
        .update({ view_count: supabase.sql`view_count + 1` })
        .eq('id', nftId);
    } catch (error) {
      console.error('Error incrementing NFT views:', error);
    }
  }
}
