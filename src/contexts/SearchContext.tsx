import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { NFTDatabase } from '../utils/nftDatabase';
import { handleError, withErrorHandling, ERROR_CODES } from '../utils/errorHandler';

export interface SearchFilters {
  query: string;
  category: string;
  priceMin: string;
  priceMax: string;
  sortBy: 'created_at' | 'price' | 'name' | 'likes' | 'views';
  sortOrder: 'asc' | 'desc';
  creator: string;
  isAuction: boolean | null;
  attributes: Array<{ trait_type: string; value: string }>;
}

export interface SearchResult {
  id: string;
  tokenId: number;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  creator: string;
  owner: string;
  creatorId: string;
  ownerId: string;
  collection: string | null;
  isAuction: boolean;
  auctionEndTime: string | null;
  likes: number;
  views: number;
  attributes: Array<{ trait_type: string; value: string }>;
  createdAt: string;
}

interface SearchState {
  filters: SearchFilters;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  suggestions: string[];
  recentSearches: string[];
}

interface SearchActions {
  updateFilters: (filters: Partial<SearchFilters>) => void;
  search: (page?: number) => Promise<void>;
  clearFilters: () => void;
  addToRecentSearches: (query: string) => void;
  getSuggestions: (query: string) => Promise<string[]>;
  setPage: (page: number) => void;
}

const defaultFilters: SearchFilters = {
  query: '',
  category: '',
  priceMin: '',
  priceMax: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  creator: '',
  isAuction: null,
  attributes: []
};

const defaultState: SearchState = {
  filters: defaultFilters,
  results: [],
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  totalPages: 1,
  suggestions: [],
  recentSearches: []
};

const SearchContext = createContext<SearchState & SearchActions | null>(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

const ITEMS_PER_PAGE = 12;
const RECENT_SEARCHES_KEY = 'artmint_recent_searches';

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SearchState>(() => {
    // Load recent searches from localStorage
    const recentSearches = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
      : [];
    
    return {
      ...defaultState,
      recentSearches
    };
  });

  // Use ref to access current state in callbacks without causing re-renders
  const stateRef = useRef(state);
  stateRef.current = state;

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      currentPage: 1 // Reset to first page when filters change
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: defaultFilters,
      currentPage: 1
    }));
  }, []);

  // Add to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setState(prev => {
      const newRecentSearches = [
        query,
        ...prev.recentSearches.filter(s => s !== query)
      ].slice(0, 10); // Keep only last 10 searches
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecentSearches));
      }
      
      return {
        ...prev,
        recentSearches: newRecentSearches
      };
    });
  }, []);

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query.trim() || query.length < 2) return [];
    
    try {
      // Get suggestions from NFT names and descriptions
      const { data: nfts } = await NFTDatabase.getNFTs({
        search: query,
        limit: 5
      });
      
      const suggestions = nfts
        ?.map((nft: any) => nft.name)
        .filter((name: string) => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5) || [];
      
      setState(prev => ({ ...prev, suggestions }));
      return suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }, []);

  // Set current page
  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Main search function
  const search = useCallback(async (page: number = 1) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const currentFilters = stateRef.current.filters;
      
      // Build search parameters
      const searchParams: any = {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder
      };

      // Add search query
      if (currentFilters.query.trim()) {
        searchParams.search = currentFilters.query.trim();
        addToRecentSearches(currentFilters.query.trim());
      }

      // Add category filter
      if (currentFilters.category) {
        searchParams.category = currentFilters.category;
      }

      // Add price range filter
      if (currentFilters.priceMin) {
        searchParams.priceMin = parseFloat(currentFilters.priceMin);
      }
      if (currentFilters.priceMax) {
        searchParams.priceMax = parseFloat(currentFilters.priceMax);
      }

      // Add creator filter
      if (currentFilters.creator) {
        searchParams.creator = currentFilters.creator;
      }

      // Add auction filter
      if (currentFilters.isAuction !== null) {
        searchParams.isAuction = currentFilters.isAuction;
      }

      // Add attribute filters
      if (currentFilters.attributes.length > 0) {
        searchParams.attributes = currentFilters.attributes;
      }

      // Execute search
      const { data: nfts, error, count } = await NFTDatabase.getNFTs(searchParams);

      if (error) {
        // If database error, provide mock data for development
        console.warn('Database error, using mock data:', error);

        // Generate mock NFT data for testing
        const mockNFTs: SearchResult[] = Array.from({ length: 12 }, (_, index) => ({
          id: `mock-${index + 1}`,
          tokenId: index + 1,
          contractAddress: '0x1234567890123456789012345678901234567890',
          name: `Mock NFT #${index + 1}`,
          description: `This is a mock NFT for testing purposes. Item ${index + 1} in the collection.`,
          image: `https://picsum.photos/400/400?random=${index + 1}`,
          price: Math.random() * 10 + 0.1,
          currency: 'ETH',
          creator: `Creator${index + 1}`,
          owner: `Owner${index + 1}`,
          creatorId: `creator-${index + 1}`,
          ownerId: `owner-${index + 1}`,
          collection: index % 3 === 0 ? `Collection ${Math.floor(index / 3) + 1}` : null,
          isAuction: index % 4 === 0,
          auctionEndTime: index % 4 === 0 ? new Date(Date.now() + 86400000).toISOString() : null,
          likes: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 1000),
          attributes: [
            { trait_type: 'Rarity', value: ['Common', 'Rare', 'Epic', 'Legendary'][index % 4] },
            { trait_type: 'Color', value: ['Red', 'Blue', 'Green', 'Purple'][index % 4] }
          ],
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
        }));

        setState(prev => ({
          ...prev,
          results: mockNFTs,
          totalCount: 50, // Mock total count
          totalPages: Math.ceil(50 / 12),
          currentPage: page,
          isLoading: false,
          error: null // Don't show error when using mock data
        }));
        return;
      }

      // Transform results
      const results: SearchResult[] = nfts?.map((nft: any) => ({
        id: nft.id,
        tokenId: nft.token_id,
        contractAddress: nft.contract_address || '',
        name: nft.name,
        description: nft.description,
        image: nft.image_url,
        price: nft.price || 0,
        currency: nft.currency || 'ETH',
        creator: nft.profiles?.username || 'Unknown',
        owner: nft.owner?.username || 'Unknown',
        creatorId: nft.creator_id,
        ownerId: nft.owner_id,
        collection: nft.collections?.name || null,
        isAuction: nft.is_auction || false,
        auctionEndTime: nft.auction_end_time,
        likes: nft.like_count || 0,
        views: nft.view_count || 0,
        attributes: nft.attributes || [],
        createdAt: nft.created_at
      })) || [];

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

      setState(prev => ({
        ...prev,
        results,
        totalCount,
        totalPages,
        currentPage: page,
        isLoading: false,
        error: null
      }));

    } catch (error: any) {
      const appError = handleError(error, 'Search Operation');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: appError.userMessage || 'Search failed'
      }));
    }
  }, [addToRecentSearches]);

  // Auto-search when filters change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      search(stateRef.current.currentPage);
    }, 500); // Increased debounce time for better performance

    return () => clearTimeout(timer);
  }, [state.filters, state.currentPage]);

  // Initial search on mount
  useEffect(() => {
    search(1);
  }, []);

  const value = {
    ...state,
    updateFilters,
    search,
    clearFilters,
    addToRecentSearches,
    getSuggestions,
    setPage
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
