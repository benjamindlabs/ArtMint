import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiHeart, FiShare2, FiEye } from 'react-icons/fi';

// Mock NFT data - in a real app, you would fetch this from your API or blockchain
const mockNFTDetails = {
  id: '1',
  name: 'Cosmic Dreamscape #42',
  creator: 'ArtistX',
  owner: '0x1234...5678',
  price: '0.45 ETH',
  description: 'A stunning digital artwork that captures the essence of cosmic dreams and interstellar imagination. This piece represents the boundary between reality and fantasy.',
  image: '/images/nft1.jpg',
  likes: 120,
  views: 1450,
  createdAt: '2025-03-15',
  attributes: [
    { trait_type: 'Background', value: 'Deep Space' },
    { trait_type: 'Style', value: 'Abstract' },
    { trait_type: 'Colors', value: 'Vibrant' },
    { trait_type: 'Rarity', value: 'Rare' },
  ],
  history: [
    { event: 'Minted', from: 'Creator', to: 'ArtistX', price: '0.1 ETH', date: '2025-03-10' },
    { event: 'Listed', from: 'ArtistX', to: 'Marketplace', price: '0.45 ETH', date: '2025-03-12' },
  ]
};

export default function NFTDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [nft, setNft] = useState(mockNFTDetails);
  const [isLiked, setIsLiked] = useState(false);

  // In a real app, you would fetch the NFT data based on the ID
  useEffect(() => {
    if (id) {
      // Fetch NFT data here
      console.log(`Fetching NFT with ID: ${id}`);
      // For now, we'll just use our mock data
    }
  }, [id]);

  const handleBuy = () => {
    alert('Purchase functionality would be implemented here with real blockchain integration');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors">
          <FiArrowLeft className="mr-2" />
          Back to marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* NFT Image */}
        <div className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-primary-500/80 to-secondary-500/80 aspect-square flex items-center justify-center">
          <div className="text-white text-4xl font-medium">
            NFT #{id}
          </div>
        </div>

        {/* NFT Details */}
        <div>
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{nft.name}</h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsLiked(!isLiked)} 
                className={`p-2 rounded-full ${isLiked ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}
              >
                <FiHeart />
              </button>
              <button className="p-2 rounded-full bg-gray-100 text-gray-500">
                <FiShare2 />
              </button>
            </div>
          </div>

          <div className="flex items-center mb-6">
            <div className="bg-gray-100 p-1 rounded-full h-8 w-8 flex items-center justify-center mr-2">
              <span className="text-xs font-medium">{nft.creator.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created by</p>
              <p className="font-medium">@{nft.creator}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">{nft.description}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Current price</p>
                <p className="text-2xl font-bold">{nft.price}</p>
              </div>
              <button 
                onClick={handleBuy} 
                className="btn-primary px-8 py-3"
              >
                Buy now
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Properties</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {nft.attributes.map((attr, index) => (
                <div key={index} className="bg-primary-50 border border-primary-100 rounded-lg p-3 text-center">
                  <p className="text-primary-600 text-xs uppercase">{attr.trait_type}</p>
                  <p className="font-medium">{attr.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">History</h2>
            <div className="border rounded-lg divide-y">
              {nft.history.map((item, index) => (
                <div key={index} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.event}</p>
                    <p className="text-sm text-gray-500">
                      From {item.from} to {item.to}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.price}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
