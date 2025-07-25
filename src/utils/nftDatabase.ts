/**
 * NFT Database utilities for real blockchain integration
 */

import { supabase } from './supabaseClient';

// Type definitions for NFT data
export interface NFTData {
  id?: string;
  tokenId: number;
  contractAddress: string;
  collectionId?: string;
  name: string;
  description?: string;
  imageUrl: string;
  animationUrl?: string;
  metadataUrl?: string;
  creatorId: string;
  ownerId: string;
  price?: number;
  currency?: string;
  isListed?: boolean;
  isAuction?: boolean;
  auctionEndTime?: string;
  royaltyPercentage?: number;
  attributes?: NFTAttribute[];
}

export interface NFTAttribute {
  traitType: string;
  value: string;
  displayType?: string;
  maxValue?: number;
}

export interface CollectionData {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  creatorId: string;
  contractAddress?: string;
  totalSupply?: number;
  floorPrice?: number;
  volumeTraded?: number;
  isVerified?: boolean;
}

export interface TransactionData {
  id?: string;
  nftId: string;
  fromUserId?: string;
  toUserId?: string;
  transactionHash: string;
  transactionType: 'mint' | 'sale' | 'transfer' | 'bid' | 'auction_win';
  price?: number;
  currency?: string;
  gasFee?: number;
  marketplaceFee?: number;
  royaltyFee?: number;
  blockNumber?: number;
}

export interface BidData {
  id?: string;
  nftId: string;
  bidderId: string;
  amount: number;
  currency?: string;
  expiresAt?: string;
  isActive?: boolean;
}

// NFT Database operations
export class NFTDatabase {
  // Create a new collection
  static async createCollection(collectionData: CollectionData): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert([{
          name: collectionData.name,
          description: collectionData.description,
          image_url: collectionData.imageUrl,
          banner_url: collectionData.bannerUrl,
          creator_id: collectionData.creatorId,
          contract_address: collectionData.contractAddress,
          total_supply: collectionData.totalSupply || 0,
          floor_price: collectionData.floorPrice,
          volume_traded: collectionData.volumeTraded || 0,
          is_verified: collectionData.isVerified || false
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating collection:', error);
      return { data: null, error };
    }
  }

  // Create a new NFT
  static async createNFT(nftData: NFTData): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .insert([{
          token_id: nftData.tokenId,
          contract_address: nftData.contractAddress,
          collection_id: nftData.collectionId,
          name: nftData.name,
          description: nftData.description,
          image_url: nftData.imageUrl,
          animation_url: nftData.animationUrl,
          metadata_url: nftData.metadataUrl,
          creator_id: nftData.creatorId,
          owner_id: nftData.ownerId,
          price: nftData.price,
          currency: nftData.currency || 'ETH',
          is_listed: nftData.isListed || false,
          is_auction: nftData.isAuction || false,
          auction_end_time: nftData.auctionEndTime,
          royalty_percentage: nftData.royaltyPercentage || 0
        }])
        .select()
        .single();

      // Add attributes if provided
      if (data && nftData.attributes && nftData.attributes.length > 0) {
        const attributeInserts = nftData.attributes.map(attr => ({
          nft_id: data.id,
          trait_type: attr.traitType,
          value: attr.value,
          display_type: attr.displayType,
          max_value: attr.maxValue
        }));

        await supabase.from('nft_attributes').insert(attributeInserts);
      }

      return { data, error };
    } catch (error) {
      console.error('Error creating NFT:', error);
      return { data: null, error };
    }
  }

  // Get NFTs with pagination and filters
  static async getNFTs(options: {
    page?: number;
    limit?: number;
    offset?: number;
    ownerId?: string;
    creatorId?: string;
    collectionId?: string;
    isListed?: boolean;
    sortBy?: 'created_at' | 'price' | 'name' | 'likes' | 'views';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    creator?: string;
    isAuction?: boolean;
    attributes?: Array<{ trait_type: string; value: string }>;
  } = {}): Promise<{ data: any[]; error: any; count: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        offset,
        ownerId,
        creatorId,
        collectionId,
        isListed,
        sortBy = 'created_at',
        sortOrder = 'desc',
        search,
        category,
        priceMin,
        priceMax,
        creator,
        isAuction,
        attributes
      } = options;

      let query = supabase
        .from('nfts')
        .select(`
          *,
          collections(name, image_url),
          profiles!nfts_creator_id_fkey(username),
          owner:profiles!nfts_owner_id_fkey(username)
        `, { count: 'exact' });

      // Apply basic filters
      if (ownerId) query = query.eq('owner_id', ownerId);
      if (creatorId) query = query.eq('creator_id', creatorId);
      if (collectionId) query = query.eq('collection_id', collectionId);
      if (isListed !== undefined) query = query.eq('is_listed', isListed);
      if (isAuction !== undefined) query = query.eq('is_auction', isAuction);

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply category filter
      if (category) {
        query = query.eq('category', category);
      }

      // Apply price range filters
      if (priceMin !== undefined) {
        query = query.gte('price', priceMin);
      }
      if (priceMax !== undefined) {
        query = query.lte('price', priceMax);
      }

      // Apply creator name filter
      if (creator) {
        query = query.eq('profiles.username', creator);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      let from: number, to: number;
      if (offset !== undefined) {
        from = offset;
        to = offset + limit - 1;
      } else {
        from = (page - 1) * limit;
        to = from + limit - 1;
      }
      query = query.range(from, to);

      const { data, error, count } = await query;

      return { data: data || [], error, count: count || 0 };
    } catch (error: any) {
      console.error('Error getting NFTs:', error);
      return { data: [], error: error?.message || 'Failed to fetch NFTs', count: 0 };
    }
  }

  // Get single NFT by ID
  static async getNFTById(id: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select(`
          *,
          collections(name, description, image_url),
          profiles!nfts_creator_id_fkey(username, avatar_url),
          owner:profiles!nfts_owner_id_fkey(username, avatar_url),
          nft_attributes(trait_type, value, display_type, max_value)
        `)
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error: any) {
      console.error('Error getting NFT:', error);
      return { data: null, error: error?.message || 'Failed to fetch NFT' };
    }
  }

  // Update NFT (for listing, price changes, etc.)
  static async updateNFT(id: string, updates: Partial<NFTData>): Promise<{ data: any; error: any }> {
    try {
      const updateData: any = {};
      
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.isListed !== undefined) updateData.is_listed = updates.isListed;
      if (updates.isAuction !== undefined) updateData.is_auction = updates.isAuction;
      if (updates.auctionEndTime !== undefined) updateData.auction_end_time = updates.auctionEndTime;
      if (updates.ownerId !== undefined) updateData.owner_id = updates.ownerId;

      const { data, error } = await supabase
        .from('nfts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating NFT:', error);
      return { data: null, error };
    }
  }

  // Record a transaction
  static async recordTransaction(transactionData: TransactionData): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          nft_id: transactionData.nftId,
          from_user_id: transactionData.fromUserId,
          to_user_id: transactionData.toUserId,
          transaction_hash: transactionData.transactionHash,
          transaction_type: transactionData.transactionType,
          price: transactionData.price,
          currency: transactionData.currency || 'ETH',
          gas_fee: transactionData.gasFee,
          marketplace_fee: transactionData.marketplaceFee,
          royalty_fee: transactionData.royaltyFee,
          block_number: transactionData.blockNumber
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error recording transaction:', error);
      return { data: null, error };
    }
  }

  // Create a bid
  static async createBid(bidData: BidData): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('bids')
        .insert([{
          nft_id: bidData.nftId,
          bidder_id: bidData.bidderId,
          amount: bidData.amount,
          currency: bidData.currency || 'ETH',
          expires_at: bidData.expiresAt,
          is_active: bidData.isActive !== false
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating bid:', error);
      return { data: null, error };
    }
  }

  // Get bids for an NFT
  static async getBidsForNFT(nftId: string): Promise<{ data: any[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          profiles(username, avatar_url)
        `)
        .eq('nft_id', nftId)
        .eq('is_active', true)
        .order('amount', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error getting bids:', error);
      return { data: [], error };
    }
  }

  // Search NFTs
  static async searchNFTs(query: string, limit: number = 20): Promise<{ data: any[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select(`
          *,
          collections(name),
          profiles!nfts_creator_id_fkey(username)
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      console.error('Error searching NFTs:', error);
      return { data: [], error };
    }
  }
}
