import React, { useState, useEffect } from 'react';
import { FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { SocialUtils } from '../utils/socialUtils';
import { toast } from 'react-toastify';

interface LikeButtonProps {
  nftId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  nftId,
  initialLikeCount = 0,
  initialIsLiked = false,
  size = 'md',
  showCount = true,
  className = ''
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has liked this NFT on mount
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (user?.id) {
        const hasLiked = await SocialUtils.hasLikedNFT(user.id, nftId);
        setIsLiked(hasLiked);
      }
    };

    checkLikeStatus();
  }, [user?.id, nftId]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like NFTs');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    
    try {
      if (isLiked) {
        // Unlike
        const result = await SocialUtils.unlikeNFT(user.id, nftId);
        if (result.success) {
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
          toast.success('Removed from favorites');
        } else {
          toast.error(result.error || 'Failed to unlike NFT');
        }
      } else {
        // Like
        const result = await SocialUtils.likeNFT(user.id, nftId);
        if (result.success) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
          toast.success('Added to favorites');
        } else {
          toast.error(result.error || 'Failed to like NFT');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'p-1 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`
        flex items-center space-x-1 rounded-full transition-all duration-200
        ${sizeClasses[size]}
        ${isLiked 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-red-500'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
      title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
    >
      <FiHeart 
        className={`${iconSizes[size]} transition-all duration-200 ${
          isLiked ? 'fill-current' : ''
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
      {showCount && (
        <span className="font-medium">
          {likeCount}
        </span>
      )}
    </button>
  );
};

export default LikeButton;
