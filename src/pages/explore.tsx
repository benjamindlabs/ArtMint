import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiFilter, FiGrid, FiList, FiChevronDown } from 'react-icons/fi';

// Mock data for NFTs
const mockNFTs = [
  {
    id: 1,
    name: 'Cosmic Dreamscape #42',
    creator: 'ArtistX',
    price: '0.45 ETH',
    image: 'https://picsum.photos/id/50/400/400',
    likes: 120,
  },
  {
    id: 2,
    name: 'Digital Horizon #18',
    creator: 'CryptoCreative',
    price: '0.32 ETH',
    image: 'https://picsum.photos/id/51/400/400',
    likes: 89,
  },
  {
    id: 3,
    name: 'Neon Genesis #7',
    creator: 'PixelPioneer',
    price: '0.28 ETH',
    image: 'https://picsum.photos/id/52/400/400',
    likes: 76,
  },
  {
    id: 4,
    name: 'Abstract Reality #15',
    creator: 'DigitalDreamer',
    price: '0.51 ETH',
    image: 'https://picsum.photos/id/53/400/400',
    likes: 132,
  },
  {
    id: 5,
    name: 'Cyberpunk City #23',
    creator: 'FutureArtist',
    price: '0.38 ETH',
    image: 'https://picsum.photos/id/54/400/400',
    likes: 95,
  },
  {
    id: 6,
    name: 'Ethereal Landscape #9',
    creator: 'VirtualVisions',
    price: '0.42 ETH',
    image: 'https://picsum.photos/id/55/400/400',
    likes: 108,
  },
  {
    id: 7,
    name: 'Digital Dreams #3',
    creator: 'ArtistX',
    price: '0.35 ETH',
    image: 'https://picsum.photos/id/56/400/400',
    likes: 67,
  },
  {
    id: 8,
    name: 'Futuristic City #11',
    creator: 'CryptoCreative',
    price: '0.47 ETH',
    image: 'https://picsum.photos/id/57/400/400',
    likes: 92,
  },
  {
    id: 9,
    name: 'Abstract Patterns #5',
    creator: 'PixelPioneer',
    price: '0.29 ETH',
    image: 'https://picsum.photos/id/58/400/400',
    likes: 84,
  },
];

// Categories for filtering
const categories = [
  'All',
  'Art',
  'Collectibles',
  'Music',
  'Photography',
  'Sports',
  'Virtual Worlds',
];

export default function Explore() {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Recently Added');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      <Head>
        <title>Explore NFTs | NFT Marketplace</title>
        <meta name="description" content="Explore and discover NFTs on our marketplace" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Explore NFTs</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100'
              }`}
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100'
              }`}
            >
              <FiList />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg ml-2"
            >
              <FiFilter />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters - Desktop */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4">Filters</h2>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center">
                      <input
                        type="radio"
                        id={category}
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="mr-2"
                      />
                      <label htmlFor={category}>{category}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Price Range</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span>{priceRange[0]} ETH</span>
                  <span>{priceRange[1]} ETH</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option>Recently Added</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Most Popular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filters - Mobile */}
          {showFilters && (
            <div className="md:hidden bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="font-bold text-lg mb-4">Filters</h2>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center">
                      <input
                        type="radio"
                        id={`mobile-${category}`}
                        name="mobile-category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="mr-2"
                      />
                      <label htmlFor={`mobile-${category}`}>{category}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Price Range</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span>{priceRange[0]} ETH</span>
                  <span>{priceRange[1]} ETH</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option>Recently Added</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Most Popular</option>
                </select>
              </div>
            </div>
          )}

          {/* NFT Grid */}
          <div className="flex-1">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockNFTs.map((nft) => (
                  <Link href={`/nft/${nft.id}`} key={nft.id} className="card group">
                    <div className="relative h-64 w-full">
                      <img src={nft.image} alt={nft.name} className="absolute inset-0 object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg group-hover:text-primary-600 transition-colors">
                          {nft.name}
                        </h3>
                        <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                          {nft.likes} ♥
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">Created by @{nft.creator}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-lg">{nft.price}</span>
                        <button className="btn-primary">Buy Now</button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {mockNFTs.map((nft) => (
                  <Link href={`/nft/${nft.id}`} key={nft.id} className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-48 h-48">
                        <img src={nft.image} alt={nft.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg hover:text-primary-600 transition-colors">
                              {nft.name}
                            </h3>
                            <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                              {nft.likes} ♥
                            </span>
                          </div>
                          <p className="text-gray-600">Created by @{nft.creator}</p>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="font-medium text-lg">{nft.price}</span>
                          <button className="btn-primary">Buy Now</button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-10 text-center">
              <button className="btn-secondary px-8 py-3">Load More</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
