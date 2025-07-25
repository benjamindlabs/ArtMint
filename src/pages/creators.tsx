import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { FiGrid, FiUser, FiDollarSign, FiBarChart2, FiPlus, FiCheck, FiX } from 'react-icons/fi';

// Mock data for creators
const topCreators = [
  { 
    id: 1, 
    name: '@james_lam', 
    items: 6, 
    image: 'https://picsum.photos/id/40/200/200', 
    verified: true,
    sales: 12.8,
    followers: 1245,
    bio: 'Digital artist specializing in abstract and surreal art pieces.'
  },
  { 
    id: 2, 
    name: '@Cold_Finance', 
    items: 8, 
    image: 'https://picsum.photos/id/41/200/200', 
    verified: true,
    sales: 8.5,
    followers: 876,
    bio: 'Nature photographer exploring the beauty of landscapes through NFTs.'
  },
  { 
    id: 3, 
    name: '@Zahari_Yakimov', 
    items: 4, 
    image: 'https://picsum.photos/id/42/200/200', 
    verified: false,
    sales: 3.2,
    followers: 432,
    bio: 'Emerging artist with a focus on urban landscapes and city life.'
  },
  { 
    id: 4, 
    name: '@boom_boom', 
    items: 12, 
    image: 'https://picsum.photos/id/43/200/200', 
    verified: true,
    sales: 24.5,
    followers: 3210,
    bio: 'Renowned digital artist creating unique and vibrant digital collectibles.'
  },
  { 
    id: 5, 
    name: '@null', 
    items: 3, 
    image: 'https://picsum.photos/id/44/200/200', 
    verified: false,
    sales: 1.8,
    followers: 215,
    bio: 'Anonymous artist exploring themes of identity and existence.'
  },
  { 
    id: 6, 
    name: '@ArtistX', 
    items: 9, 
    image: 'https://picsum.photos/id/45/200/200', 
    verified: true,
    sales: 15.3,
    followers: 1876,
    bio: 'Blending traditional art techniques with digital innovation.'
  },
];

export default function Creators() {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sales');

  // Sort and filter creators
  const sortedCreators = [...topCreators].sort((a, b) => {
    if (sortBy === 'sales') return b.sales - a.sales;
    if (sortBy === 'items') return b.items - a.items;
    if (sortBy === 'followers') return b.followers - a.followers;
    return 0;
  });

  const filteredCreators = filter === 'all' 
    ? sortedCreators 
    : filter === 'verified' 
      ? sortedCreators.filter(creator => creator.verified) 
      : sortedCreators.filter(creator => !creator.verified);

  return (
    <>
      <Head>
        <title>Creators | ArtMint NFT Marketplace</title>
        <meta name="description" content="Discover top NFT creators and artists" />
      </Head>

      <div className="bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Creators</h1>
              <p className="text-gray-600 dark:text-gray-400">Discover talented artists in the NFT space</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/become-creator" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                <FiPlus className="mr-2" /> Become a Creator
              </Link>
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                }`}
              >
                All Creators
              </button>
              <button 
                onClick={() => setFilter('verified')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'verified' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                }`}
              >
                Verified Only
              </button>
              <button 
                onClick={() => setFilter('new')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'new' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                }`}
              >
                New Artists
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-gray-300">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="sales">Volume</option>
                <option value="items">Items</option>
                <option value="followers">Followers</option>
              </select>
            </div>
          </div>

          {/* Creators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCreators.map((creator) => (
              <div key={creator.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-32 bg-gradient-to-r from-purple-500 to-indigo-500">
                  <div className="absolute -bottom-10 left-4">
                    <div className="relative">
                      <Image 
                        src={creator.image} 
                        alt={creator.name} 
                        width={80} 
                        height={80} 
                        className="rounded-full border-4 border-white dark:border-gray-800 object-cover w-20 h-20"
                      />
                      {creator.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 text-xs">
                          <FiCheck className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-12 p-4">
                  <Link href={`/profile/${creator.name.substring(1)}`}>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      {creator.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {creator.bio}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Items</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{creator.items}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sales</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{creator.sales} ETH</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{creator.followers}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="w-full py-2 border border-purple-600 text-purple-600 dark:text-purple-400 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                      Follow
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                Previous
              </button>
              <button className="px-3 py-1 rounded-md bg-purple-600 text-white">
                1
              </button>
              <button className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                2
              </button>
              <button className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                3
              </button>
              <span className="text-gray-500">...</span>
              <button className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
