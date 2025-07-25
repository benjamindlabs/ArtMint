import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { FiSearch, FiHeart, FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Mock data for NFTs
const mockNFTs = [
  {
    id: 1,
    name: 'Winter Landscape',
    creator: '@Cold_Finance',
    price: '1.98 ETH',
    image: 'https://picsum.photos/id/10/400/400',
    likes: 0,
  },
  {
    id: 2,
    name: 'Sunrise',
    creator: '@Cold_Finance',
    price: '1.98 ETH',
    image: 'https://picsum.photos/id/11/400/400',
    likes: 1,
  },
  {
    id: 3,
    name: 'Bosfora',
    creator: '@Cold_Finance',
    price: '1.98 ETH',
    image: 'https://picsum.photos/id/12/400/400',
    likes: 0,
  },
  {
    id: 4,
    name: 'Bosfora Sunset',
    creator: '@Cold_Finance',
    price: '0.15 ETH',
    image: 'https://picsum.photos/id/13/400/400',
    likes: 0,
  },
  {
    id: 5,
    name: 'Digital Horizon',
    creator: '@Cold_Finance',
    price: '0.32 ETH',
    image: 'https://picsum.photos/id/14/400/400',
    likes: 0,
  },
  {
    id: 6,
    name: 'Ethereal Landscape',
    creator: '@Cold_Finance',
    price: '0.42 ETH',
    image: 'https://picsum.photos/id/15/400/400',
    likes: 0,
  },
];

// Mock data for collections
const collections = [
  { id: 1, name: 'Happy', items: 1, creator: '@james_lam', image: 'https://picsum.photos/id/16/400/400', likes: 2 },
  { id: 2, name: 'Abstract Art', items: 5, creator: '@james_lam', image: 'https://picsum.photos/id/17/400/400', likes: 2 },
  { id: 3, name: 'Serene Loneliness', items: 0, creator: '@null', image: 'https://picsum.photos/id/18/400/400', likes: 1 },
];

// Mock data for top artists
const topArtists = [
  { id: 1, name: '@james_lam', items: 6, image: 'https://picsum.photos/id/19/200/200', verified: true },
  { id: 2, name: '@creative_mind', items: 8, image: 'https://picsum.photos/id/20/200/200', verified: true },
  { id: 3, name: '@nft_creator', items: 12, image: 'https://picsum.photos/id/21/200/200', verified: true },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('trending');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user prefers dark mode
    if (typeof window !== 'undefined') {
      const isDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(isDarkMode);
    }
  }, []);

  return (
    <>
      <Head>
        <title>ArtMint - Discover, Collect, and Sell NFTs</title>
        <meta name="description" content="A modern NFT marketplace for digital collectibles" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
              Discover digital art and collect NFTs
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              ArtMintNFT is a shared liquidity NFT market smart contract which is used by multiple websites to provide the users the best possible experience.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/marketplace" className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                View market
              </Link>
              <Link href="/claim" className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Claim Free NFTs
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <Image 
                  src="https://picsum.photos/id/22/400/400" 
                  alt="Featured NFT" 
                  width={400} 
                  height={400} 
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <Image 
                  src="https://picsum.photos/id/23/400/400" 
                  alt="Featured NFT" 
                  width={400} 
                  height={400} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 mt-8">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <Image 
                  src="https://picsum.photos/id/24/400/400" 
                  alt="Featured NFT" 
                  width={400} 
                  height={400} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <Image 
                  src="https://picsum.photos/id/25/400/400" 
                  alt="Featured NFT" 
                  width={400} 
                  height={400} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Collections</h2>
            <Link href="/collections" className="text-purple-600 dark:text-purple-400 hover:underline flex items-center">
              View All Collections <FiArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div key={collection.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 bg-gray-200 dark:bg-gray-700">
                  <Image 
                    src={collection.image} 
                    alt={collection.name} 
                    width={400} 
                    height={200} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {collection.creator}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <FiHeart className={collection.likes > 0 ? "text-red-500" : "text-gray-400"} />
                      <span>{collection.likes}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{collection.items} items</span>
                    <Link href={`/collection/${collection.id}`} className="text-purple-600 dark:text-purple-400 hover:underline text-sm">
                      View Collection
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Artists */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Top Artists</h2>
            <div className="flex gap-2">
              <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                <FiChevronLeft className="text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                <FiChevronRight className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topArtists.map((artist) => (
              <div key={artist.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Image 
                      src={artist.image} 
                      alt={artist.name} 
                      width={60} 
                      height={60} 
                      className="rounded-full object-cover"
                    />
                    {artist.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {artist.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {artist.items} Items
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Explore</h2>
            <Link href="/marketplace" className="text-purple-600 dark:text-purple-400 hover:underline flex items-center">
              View All Items <FiArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockNFTs.map((nft) => (
              <div key={nft.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700">
                    <Image 
                      src={nft.image} 
                      alt={nft.name} 
                      width={400} 
                      height={400} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-full p-2 shadow-md">
                    <div className="flex items-center gap-1 text-sm">
                      <FiHeart className={nft.likes > 0 ? "text-red-500" : "text-gray-400"} />
                      <span>{nft.likes}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                    <p className="text-sm font-medium">{nft.creator}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {nft.name}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">{nft.price}</span>
                    <Link href={`/nft/${nft.id}`} className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors">
                      Place Bid
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
