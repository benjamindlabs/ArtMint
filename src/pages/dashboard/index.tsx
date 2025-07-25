import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiGrid, FiDollarSign, FiUpload, FiDownload, FiUser, FiSettings, FiCopy, FiShare2, FiPlus, FiCheck, FiImage, FiList, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { isUserAdmin } from '../../utils/adminUtils';
import EnhancedCreateButton from '../../components/EnhancedCreateButton';

const DashboardPage = () => {
  const { user, profile, loading, refreshSession } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('items');
  const [copied, setCopied] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Try to refresh session if needed
  const checkAndRefreshSession = useCallback(async () => {
    if (!user && !loading && loadAttempts < 3) {
      console.log('Attempting to refresh session...');
      await refreshSession();
      setLoadAttempts(prev => prev + 1);
    }
  }, [user, loading, loadAttempts, refreshSession]);

  useEffect(() => {
    checkAndRefreshSession();
  }, [checkAndRefreshSession]);

  // Redirect if not authenticated after attempts
  useEffect(() => {
    if (!loading && !user && loadAttempts >= 3) {
      console.log('Redirecting to signin after failed session refresh attempts');
      router.push('/auth/signin');
    }
  }, [user, loading, loadAttempts, router.push]);

  // Set avatar URL from profile
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Check for success messages from other pages
  useEffect(() => {
    const { withdraw, deposit } = router.query;
    if (withdraw === 'success') {
      // Could show a success toast here
    }
    if (deposit === 'success') {
      // Could show a success toast here
    }
  }, [router.query]);

  // Fetch user items and collections
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Check if items table exists before fetching
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('creator_id', user.id);
          
        if (itemsError) {
          if (itemsError.code === '42P01') { // Table doesn't exist error
            console.log('Items table does not exist yet. This is expected in a new setup.');
            setItems([]);
          } else {
            console.error('Error fetching items:', itemsError);
            setItems([]);
          }
        } else {
          setItems(itemsData || []);
        }
        
        // Check if collections table exists before fetching
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('*')
          .eq('creator_id', user.id);
          
        if (collectionsError) {
          if (collectionsError.code === '42P01') { // Table doesn't exist error
            console.log('Collections table does not exist yet. This is expected in a new setup.');
            setCollections([]);
          } else {
            console.error('Error fetching collections:', collectionsError);
            setCollections([]);
          }
        } else {
          setCollections(collectionsData || []);
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        setItems([]);
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
    };
    
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  if (loading || (!user && loadAttempts < 3)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-700 dark:text-gray-300">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  // Show profile creation prompt if profile doesn't exist
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to ArtMint!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're setting up your profile. This usually happens automatically, but it seems there was an issue.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Refresh Page
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>If this issue persists, please contact support.</p>
                <p className="mt-2">User ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <Link
                  href="/dashboard/debug"
                  className="inline-block mt-3 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  Debug Dashboard Issues
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const copyWalletAddress = () => {
    if (profile.wallet_address) {
      navigator.clipboard.writeText(profile.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mock wallet address if not set
  const walletAddress = profile.wallet_address || '0x4c133b17e3328Dd4Aa59E94BED61a2D582cd0';
  const truncatedAddress = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      const avatar_url = data.publicUrl;
      
      // Update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url })
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setAvatarUrl(avatar_url);
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard | ArtMint NFT Marketplace</title>
        <meta name="description" content="Manage your NFTs, collections, and account settings" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 text-center">
                  <div className="relative mx-auto h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-purple-100 dark:bg-purple-900">
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                          {profile.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-purple-600 p-1 rounded-full text-white hover:bg-purple-700 transition-colors"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <FiImage className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {profile.username || 'User'}
                  </h2>
                  
                  <div className="mt-2 flex items-center justify-center">
                    <button
                      onClick={copyWalletAddress}
                      className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span className="mr-1">{truncatedAddress}</span>
                      {copied ? (
                        <FiCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <FiCopy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center">
                    <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                        {profile.balance_eth || 0} ETH
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <nav className="flex flex-col">
                    <button
                      onClick={() => setActiveTab('items')}
                      className={`flex items-center px-6 py-3 text-sm font-medium ${
                        activeTab === 'items'
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-l-4 border-purple-500'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <FiGrid className="mr-3 h-5 w-5" />
                      My Items
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('collections')}
                      className={`flex items-center px-6 py-3 text-sm font-medium ${
                        activeTab === 'collections'
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-l-4 border-purple-500'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <FiList className="mr-3 h-5 w-5" />
                      My Collections
                    </button>
                    
                    <Link
                      href="/dashboard/deposit"
                      className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <FiUpload className="mr-3 h-5 w-5" />
                      Deposit
                    </Link>
                    
                    <Link
                      href="/dashboard/withdraw"
                      className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <FiDownload className="mr-3 h-5 w-5" />
                      Withdraw
                    </Link>
                    
                    <button
                      onClick={() => setActiveTab('about')}
                      className={`flex items-center px-6 py-3 text-sm font-medium ${
                        activeTab === 'about'
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-l-4 border-purple-500'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <FiUser className="mr-3 h-5 w-5" />
                      Profile
                    </button>
                    
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <FiShield className="mr-3 h-5 w-5" />
                        Admin Panel
                      </Link>
                    )}
                  </nav>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3">
              {activeTab === 'items' && (
                <div>
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Items</h2>
                    <EnhancedCreateButton variant="dropdown" />
                  </div>
                  
                  {isLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Item cards would go here */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Example NFT</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">This is a placeholder for your NFTs</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any items yet.</p>
                      <Link
                        href="/create/item"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                      >
                        <FiPlus className="mr-2 -ml-1 h-5 w-5" />
                        <span>Create Your First Item</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'collections' && (
                <div>
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Collections</h2>
                    <Link
                      href="/create/collection"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <FiPlus className="mr-2 -ml-1 h-5 w-5" />
                      <span>Create Collection</span>
                    </Link>
                  </div>
                  
                  {isLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : collections.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Collection cards would go here */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Example Collection</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">This is a placeholder for your collections</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any collections yet.</p>
                      <Link
                        href="/create/collection"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                      >
                        <FiPlus className="mr-2 -ml-1 h-5 w-5" />
                        <span>Create Collection</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">About Me</h2>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <form className="space-y-6">
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          id="username"
                          defaultValue={profile.username || ''}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Your username"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          rows={4}
                          defaultValue={profile.bio || ''}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Tell us about yourself"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          id="website"
                          defaultValue={profile.website || ''}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Twitter
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            @
                          </span>
                          <input
                            type="text"
                            id="twitter"
                            defaultValue={profile.twitter || ''}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-purple-500 focus:border-purple-500"
                            placeholder="username"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <button
                          type="submit"
                          className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
