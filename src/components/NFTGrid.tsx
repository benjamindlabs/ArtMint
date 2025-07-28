/**
 * Responsive NFT Grid Component with lazy loading and mobile optimization
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiEye, FiMoreVertical, FiMessageCircle } from 'react-icons/fi';
import LikeButton from './LikeButton';
import FollowButton from './FollowButton';

interface NFTGridProps {
  nfts: any[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  viewMode?: 'grid' | 'list';
  className?: string;
}

interface NFTCardProps {
  nft: any;
  viewMode: 'grid' | 'list';
  onLike?: (nftId: string) => void;
  onShare?: (nft: any) => void;
}

// Individual NFT Card Component with optimized rendering
const NFTCard = memo<NFTCardProps>(({ nft, viewMode, onLike, onShare }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(nft);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative w-full sm:w-48 h-48 sm:h-32 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            <Link href={`/nft/${nft.id}`}>
              {!imageError ? (
                <Image
                  src={nft.image}
                  alt={nft.name}
                  fill
                  className={`object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  sizes="(max-width: 640px) 100vw, 192px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">No Image</span>
                </div>
              )}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <Link href={`/nft/${nft.id}`}>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    {nft.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  by {nft.creator}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <LikeButton
                  nftId={nft.id}
                  initialLikeCount={nft.like_count || 0}
                  size="sm"
                  showCount={false}
                />
                <div className="flex items-center space-x-1 text-gray-500 text-sm">
                  <FiMessageCircle className="w-4 h-4" />
                  <span>{nft.comment_count || 0}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500 text-sm">
                  <FiEye className="w-4 h-4" />
                  <span>{nft.view_count || 0}</span>
                </div>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Share NFT"
                >
                  <FiMoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {nft.price} {nft.currency || 'ETH'}
                </p>
              </div>
              
              <Link
                href={`/nft/${nft.id}`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-200 dark:bg-gray-700">
        <Link href={`/nft/${nft.id}`}>
          {isVisible && !imageError ? (
            <Image
              src={nft.image}
              alt={nft.name}
              fill
              className={`object-cover transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
              loading="lazy"
            />
          ) : imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
              <span className="text-gray-500 dark:text-gray-400 text-sm">No Image</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
        </Link>

        {/* Overlay actions */}
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div onClick={(e) => e.stopPropagation()}>
            <LikeButton
              nftId={nft.id}
              initialLikeCount={nft.like_count || 0}
              size="sm"
              showCount={false}
              className="bg-white/90 dark:bg-gray-800/90 shadow-sm hover:bg-white dark:hover:bg-gray-800"
            />
          </div>
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
            aria-label="Share NFT"
          >
            <FiMoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-2 text-white text-sm">
          <div className="flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
            <FiEye className="w-3 h-3" />
            <span>{nft.view_count || 0}</span>
          </div>
          <div className="flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
            <FiHeart className="w-3 h-3" />
            <span>{nft.like_count || 0}</span>
          </div>
          <div className="flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
            <FiMessageCircle className="w-3 h-3" />
            <span>{nft.comment_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <Link href={`/nft/${nft.id}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              {nft.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            by {nft.creator}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {nft.price} {nft.currency || 'ETH'}
            </p>
          </div>
          
          <Link
            href={`/nft/${nft.id}`}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
});

NFTCard.displayName = 'NFTCard';

// Main NFT Grid Component
const NFTGrid: React.FC<NFTGridProps> = ({
  nfts,
  loading = false,
  onLoadMore,
  hasMore = false,
  viewMode = 'grid',
  className = ''
}) => {
  const [visibleNFTs, setVisibleNFTs] = useState<any[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  const lastNFTElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && onLoadMore) {
        onLoadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, onLoadMore]);

  useEffect(() => {
    setVisibleNFTs(nfts);
  }, [nfts]);

  const handleLike = (nftId: string) => {
    // Implement like functionality
    console.log('Liked NFT:', nftId);
  };

  const handleShare = (nft: any) => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: nft.name,
        text: `Check out this NFT: ${nft.name}`,
        url: `${window.location.origin}/nft/${nft.id}`,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/nft/${nft.id}`);
    }
  };

  if (loading && visibleNFTs.length === 0) {
    return (
      <div className={`${className}`}>
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${
                viewMode === 'grid' ? 'aspect-square' : 'h-32'
              }`} />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`grid gap-4 sm:gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {visibleNFTs.map((nft, index) => (
          <div
            key={nft.id}
            ref={index === visibleNFTs.length - 1 ? lastNFTElementRef : null}
          >
            <NFTCard
              nft={nft}
              viewMode={viewMode}
              onLike={handleLike}
              onShare={handleShare}
            />
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && visibleNFTs.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-4" />
    </div>
  );
};

export default NFTGrid;
