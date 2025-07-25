import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiUserCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { SocialUtils } from '../utils/socialUtils';
import { toast } from 'react-toastify';

interface FollowButtonProps {
  userId: string;
  username?: string;
  initialIsFollowing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  username,
  initialIsFollowing = false,
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is following on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (user?.id) {
        const following = await SocialUtils.isFollowing(user.id, userId);
        setIsFollowing(following);
      }
    };

    checkFollowStatus();
  }, [user?.id, userId]);

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const result = await SocialUtils.unfollowUser(user.id, userId);
        if (result.success) {
          setIsFollowing(false);
          toast.success(`Unfollowed ${username || 'user'}`);
        } else {
          toast.error(result.error || 'Failed to unfollow user');
        }
      } else {
        // Follow
        const result = await SocialUtils.followUser(user.id, userId);
        if (result.success) {
          setIsFollowing(true);
          toast.success(`Now following ${username || 'user'}`);
        } else {
          toast.error(result.error || 'Failed to follow user');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show follow button for own profile
  if (user?.id === userId) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: isFollowing 
      ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
      : 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: isFollowing
      ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
      : 'bg-gray-800 text-white hover:bg-gray-900',
    outline: isFollowing
      ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      : 'bg-white text-primary-600 border border-primary-600 hover:bg-primary-50'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`
        flex items-center space-x-2 rounded-lg font-medium transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : isFollowing ? (
        <FiUserCheck className={iconSizes[size]} />
      ) : (
        <FiUserPlus className={iconSizes[size]} />
      )}
      
      <span>
        {isLoading 
          ? 'Loading...' 
          : isFollowing 
          ? 'Following' 
          : 'Follow'
        }
      </span>
    </button>
  );
};

export default FollowButton;
