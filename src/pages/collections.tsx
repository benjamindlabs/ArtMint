import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiPlus } from 'react-icons/fi';

// Mock data for collections
const collections = [
  { 
    id: 1, 
    name: 'Happy', 
    items: 1, 
    creator: '@james_lam', 
    image: 'https://picsum.photos/id/20/400/200', 
    likes: 2,
    description: 'A collection of happy moments captured in digital art form.'
  },
  { 
    id: 2, 
    name: 'g geg gagfg', 
    items: 5, 
    creator: '@james_lam', 
    image: 'https://picsum.photos/id/21/400/200', 
    likes: 2,
    description: 'Abstract art pieces exploring the boundaries of digital expression.'
  },
  { 
    id: 3, 
    name: 'serene loneliness', 
    items: 0, 
    creator: '@null', 
    image: 'https://picsum.photos/id/22/400/200', 
    likes: 1,
    description: 'Capturing the beauty and peace found in moments of solitude.'
  },
  { 
    id: 4, 
    name: 'Digital Dreams', 
    items: 8, 
    creator: '@Cold_Finance', 
    image: 'https://picsum.photos/id/23/400/200', 
    likes: 5,
    description: 'A journey through dreamscapes created in the digital realm.'
  },
  { 
    id: 5, 
    name: 'Nature\'s Palette', 
    items: 12, 
    creator: '@Zahari_Yakimov', 
    image: 'https://picsum.photos/id/24/400/200', 
    likes: 7,
    description: 'The colors and textures of nature reimagined as digital art.'
  },
  { 
    id: 6, 
    name: 'Urban Visions', 
    items: 3, 
    creator: '@Cold_Finance', 
    image: 'https://picsum.photos/id/25/400/200', 
    likes: 4,
    description: 'Exploring city life and urban landscapes through digital art.'
  },
];

export default function Collections() {
  const [filter, setFilter] = useState('all');

  const filteredCollections = filter === 'all' 
    ? collections 
    : collections.filter(collection => 
        filter === 'trending' 
          ? collection.likes > 3 
          : collection.items > 5
      );

  return (
    <>
      <Head>
        <title>Collections | ArtMint NFT Marketplace</title>
        <meta name="description" content="Browse and discover unique NFT collections" />
      </Head>

      <div className="bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Collections</h1>
              <p className="text-gray-600 dark:text-gray-400">Discover, collect, and sell extraordinary NFTs</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/create-collection" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                <FiPlus className="mr-2" /> Create Collection
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
            >
              All Collections
            </button>
            <button 
              onClick={() => setFilter('trending')}
              className={`px-4 py-2 rounded-md ${
                filter === 'trending' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Trending
            </button>
            <button 
              onClick={() => setFilter('top')}
              className={`px-4 py-2 rounded-md ${
                filter === 'top' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Top
            </button>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCollections.map((collection) => (
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {collection.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <Link href={`/profile/${collection.creator.substring(1)}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                      {collection.creator}
                    </Link>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {collection.items} {collection.items === 1 ? 'item' : 'items'}
                    </span>
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
