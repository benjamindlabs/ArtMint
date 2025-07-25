import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { FiEdit2, FiCopy, FiExternalLink, FiGrid, FiHeart, FiActivity, FiSettings, FiCheck } from 'react-icons/fi';

// Mock data for user profile
const mockProfile = {
  address: '0x1234...5678',
  fullAddress: '0x1234567890abcdef1234567890abcdef12345678',
  username: '@boom_boom',
  bio: 'Digital art enthusiast and NFT collector. Always looking for unique pieces that tell a story.',
  joinedDate: 'March 2025',
  profileImage: 'https://picsum.photos/id/64/200/200',
  coverImage: 'https://picsum.photos/id/65/1200/400',
};

// Mock data for owned NFTs
const mockOwnedNFTs = [
  {
    id: 1,
    name: 'winter',
    creator: '@Cold_Finance',
    price: '1.980000 ETH',
    image: 'https://picsum.photos/id/60/400/400',
    likes: 0,
  },
  {
    id: 2,
    name: 'sunrise',
    creator: '@Cold_Finance',
    price: '1.980000 ETH',
    image: 'https://picsum.photos/id/61/400/400',
    likes: 1,
  },
  {
    id: 3,
    name: 'bosfora',
    creator: '@Cold_Finance',
    price: '1.980000 ETH',
    image: 'https://picsum.photos/id/62/400/400',
    likes: 0,
  },
];

// Mock data for created NFTs
const mockCreatedNFTs = [
  {
    id: 4,
    name: 'Digital Horizon',
    price: '0.32 ETH',
    image: 'https://picsum.photos/id/63/400/400',
    likes: 0,
  },
  {
    id: 5,
    name: 'Ethereal Landscape',
    price: '0.42 ETH',
    image: 'https://picsum.photos/id/64/400/400',
    likes: 0,
  },
];

// Mock data for collections
const mockCollections = [
  { 
    id: 1, 
    name: 'Happy', 
    items: 1, 
    image: 'https://picsum.photos/id/65/400/400', 
    likes: 2 
  },
  { 
    id: 2, 
    name: 'g geg gagfg', 
    items: 5, 
    image: 'https://picsum.photos/id/66/400/400', 
    likes: 2 
  },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('items');
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(mockProfile.fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>{mockProfile.username} | ArtMint NFT Marketplace</title>
        <meta name="description" content="User profile on ArtMint NFT Marketplace" />
      </Head>

      <div className="bg-gray-50 dark:bg-gray-900">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-64 w-full relative">
            <Image 
              src={mockProfile.coverImage}
              alt="Cover Image"
              fill
              className="object-cover"
            />
          </div>
          
          {/* Profile Info */}
          <div className="container mx-auto px-4">
            <div className="relative -mt-16 mb-8 flex flex-col items-center">
              {/* Profile Image */}
              <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg">
                <Image 
                  src={mockProfile.profileImage}
                  alt={mockProfile.username}
                  width={128}
                  height={128}
                  className="rounded-full object-cover"
                />
              </div>
              
              <div className="mt-4 text-center">
                <h1 className="text-2xl font-bold dark:text-white">{mockProfile.username}</h1>
                
                <div className="flex items-center justify-center mt-2 mb-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1 flex items-center shadow-sm">
                    <span className="text-gray-600 dark:text-gray-300 text-sm mr-2">{mockProfile.address}</span>
                    <button 
                      onClick={copyAddress}
                      className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    </button>
                  </div>
                  {copied && (
                    <span className="ml-2 text-green-600 dark:text-green-400 text-sm">Copied!</span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">{mockProfile.bio}</p>
                
                <div className="flex justify-center gap-4 mb-6">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                    Follow
                  </button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <FiEdit2 className="inline mr-1" /> Edit Profile
                  </button>
                </div>
                
                <div className="flex justify-center gap-8 text-center">
                  <div>
                    <div className="text-xl font-bold dark:text-white">256</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold dark:text-white">1.2K</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold dark:text-white">15.8</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ETH Volume</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="container mx-auto px-4 pb-12">
          <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('items')}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 ${
                  activeTab === 'items'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiGrid className="inline mr-1" /> Items
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 ${
                  activeTab === 'collections'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiGrid className="inline mr-1" /> Collections
              </button>
              <button
                onClick={() => setActiveTab('created')}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 ${
                  activeTab === 'created'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiGrid className="inline mr-1" /> Created
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 ${
                  activeTab === 'favorites'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiHeart className="inline mr-1" /> Favorites
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 ${
                  activeTab === 'activity'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiActivity className="inline mr-1" /> Activity
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'items' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mockOwnedNFTs.map((nft) => (
                    <div key={nft.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <Link href={`/nft/${nft.id}`}>
                        <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
                          <Image 
                            src={nft.image} 
                            alt={nft.name} 
                            width={400} 
                            height={400} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-full p-2 shadow-md">
                            <div className="flex items-center gap-1 text-sm">
                              <FiHeart className={nft.likes > 0 ? "text-red-500" : "text-gray-400"} />
                              <span>{nft.likes}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link href={`/nft/${nft.id}`}>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                            {nft.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Created by {nft.creator}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white">{nft.price}</span>
                          <Link href={`/nft/${nft.id}`} className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors">
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {mockOwnedNFTs.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You don't own any NFTs yet</p>
                    <Link href="/marketplace" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                      Explore NFTs
                    </Link>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'collections' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {mockCollections.map((collection) => (
                    <div key={collection.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <Link href={`/collection/${collection.id}`}>
                        <div className="relative">
                          <div className="h-48 bg-gray-200 dark:bg-gray-700">
                            <Image 
                              src={collection.image} 
                              alt={collection.name} 
                              width={400} 
                              height={200} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-full p-2 shadow-md">
                            <div className="flex items-center gap-1 text-sm">
                              <FiHeart className={collection.likes > 0 ? "text-red-500" : "text-gray-400"} />
                              <span>{collection.likes}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link href={`/collection/${collection.id}`}>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                            {collection.name}
                          </h3>
                        </Link>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {collection.items} {collection.items === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {mockCollections.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any collections yet</p>
                    <Link href="/create-collection" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                      Create Collection
                    </Link>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'created' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mockCreatedNFTs.map((nft) => (
                    <div key={nft.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <Link href={`/nft/${nft.id}`}>
                        <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
                          <Image 
                            src={nft.image} 
                            alt={nft.name} 
                            width={400} 
                            height={400} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-full p-2 shadow-md">
                            <div className="flex items-center gap-1 text-sm">
                              <FiHeart className={nft.likes > 0 ? "text-red-500" : "text-gray-400"} />
                              <span>{nft.likes}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link href={`/nft/${nft.id}`}>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                            {nft.name}
                          </h3>
                        </Link>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white">{nft.price}</span>
                          <button className="px-3 py-1 border border-purple-600 text-purple-600 dark:text-purple-400 text-sm rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {mockCreatedNFTs.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any NFTs yet</p>
                    <Link href="/create" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                      Create NFT
                    </Link>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'favorites' && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any favorite NFTs yet</p>
                <Link href="/marketplace" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                  Explore NFTs
                </Link>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium dark:text-white">Purchased NFT</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">winter</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium dark:text-white">1.980000 ETH</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">2 days ago</p>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium dark:text-white">Listed NFT</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">sunrise</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium dark:text-white">1.980000 ETH</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">5 days ago</p>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium dark:text-white">Created NFT</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Digital Horizon</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">1 week ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
