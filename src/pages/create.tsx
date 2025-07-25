import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { FiUpload, FiInfo, FiX, FiDollarSign, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { createNFTMetadata } from '../utils/ipfs';
import { NFTDatabase } from '../utils/nftDatabase';
import { isValidNFTName, isValidNFTDescription, isValidEthPrice, isValidNFTFile } from '../utils/validation';
import { mintNFT, getGasEstimate } from '../utils/realBlockchain';
import { useWallet } from '../hooks/useWallet';
import { toast } from 'react-toastify';
import MetaMaskGuide from '../components/MetaMaskGuide';

export default function Create() {
  const { user } = useAuth();
  const wallet = useWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attributes, setAttributes] = useState<Array<{ trait_type: string; value: string }>>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [gasEstimate, setGasEstimate] = useState<{ gasLimit: string; gasPrice: string; estimatedCost: string } | null>(null);
  const [royaltyPercentage, setRoyaltyPercentage] = useState('2.5');
  const [mintingStep, setMintingStep] = useState<'form' | 'uploading' | 'minting' | 'success'>('form');
  const [showMetaMaskGuide, setShowMetaMaskGuide] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file
      const fileValidation = isValidNFTFile(selectedFile);
      if (!fileValidation.isValid) {
        setErrors(prev => ({ ...prev, file: fileValidation.errors.join(', ') }));
        return;
      }

      setFile(selectedFile);
      setErrors(prev => ({ ...prev, file: '' }));

      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate name
    const nameValidation = isValidNFTName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.errors.join(', ');
    }

    // Validate description
    const descValidation = isValidNFTDescription(description);
    if (!descValidation.isValid) {
      newErrors.description = descValidation.errors.join(', ');
    }

    // Validate price
    const priceValidation = isValidEthPrice(price);
    if (!priceValidation.isValid) {
      newErrors.price = priceValidation.errors.join(', ');
    }

    // Validate file
    if (!file) {
      newErrors.file = 'Please select a file';
    }

    // Check authentication
    if (!user) {
      newErrors.auth = 'Please sign in to create NFTs';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check wallet connection
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet to mint NFTs');
      return;
    }

    setIsSubmitting(true);
    setMintingStep('uploading');

    try {
      toast.info('📤 Uploading to IPFS...');

      // 1. Upload file and metadata to IPFS
      const metadataResult = await createNFTMetadata(
        file!,
        name,
        description,
        attributes.map(attr => ({
          trait_type: attr.trait_type,
          value: attr.value
        }))
      );

      if (!metadataResult.success) {
        throw new Error(metadataResult.error || 'Failed to upload to IPFS');
      }

      toast.success('✅ Uploaded to IPFS successfully!');
      setMintingStep('minting');
      toast.info('⛏️ Minting NFT on blockchain...');

      // 2. Mint NFT on blockchain
      const royaltyFraction = Math.floor(parseFloat(royaltyPercentage) * 100); // Convert to basis points
      const mintResult = await mintNFT(
        wallet.account!,
        metadataResult.metadataUrl!,
        wallet.account!, // Royalty recipient (creator)
        royaltyFraction
      );

      if (!mintResult.success) {
        throw new Error(mintResult.error || 'Failed to mint NFT on blockchain');
      }

      toast.success('🎉 NFT minted on blockchain!');
      toast.info('💾 Saving to database...');

      // 3. Create NFT record in database with real blockchain data
      const nftData = {
        tokenId: mintResult.tokenId!,
        contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '',
        name,
        description,
        imageUrl: metadataResult.imageUrl!,
        metadataUrl: metadataResult.metadataUrl!,
        creatorId: user!.id,
        ownerId: user!.id,
        price: parseFloat(price),
        currency: 'ETH',
        isListed: true,
        transactionHash: mintResult.transactionHash,
        gasUsed: mintResult.gasUsed,
        royaltyPercentage: parseFloat(royaltyPercentage),
        attributes: attributes.map(attr => ({
          traitType: attr.trait_type,
          value: attr.value
        }))
      };

      const { data: nft, error } = await NFTDatabase.createNFT(nftData);

      if (error) {
        throw new Error('Failed to create NFT in database');
      }

      setMintingStep('success');
      toast.success('🎨 NFT created successfully!');

      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setFile(null);
      setPreview(null);
      setAttributes([]);
      setErrors({});

    } catch (error: any) {
      console.error('Error creating NFT:', error);
      toast.error(error.message || 'Error creating NFT. Please try again.');
    } finally {
      setIsSubmitting(false);
      setMintingStep('form');
    }
  };

  // Estimate gas when form is ready
  const estimateGas = async () => {
    if (wallet.isConnected && name && description && file) {
      try {
        const estimate = await getGasEstimate('mintNFT', []);
        setGasEstimate(estimate);
      } catch (error) {
        console.error('Error estimating gas:', error);
      }
    }
  };

  // Auto-estimate gas when form changes
  useEffect(() => {
    if (wallet.isConnected && name && description && file) {
      const timer = setTimeout(estimateGas, 1000);
      return () => clearTimeout(timer);
    }
  }, [wallet.isConnected, name, description, file]);

  return (
    <>
      <Head>
        <title>Create NFT | NFT Marketplace</title>
        <meta name="description" content="Create and mint your own NFT" />
      </Head>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Create New NFT</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Upload File</h2>
              <p className="text-gray-600 mb-4">
                Upload your artwork as a JPG, PNG, GIF, or MP4 file. Max size: 100MB.
              </p>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center ${
                  preview ? 'border-primary-400' : 'border-gray-300 hover:border-primary-400'
                } transition-colors cursor-pointer`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {preview ? (
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-64 mx-auto rounded"
                    />
                    <button 
                      className="mt-4 text-gray-600 hover:text-primary-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview(null);
                      }}
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <FiUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Click or drag and drop file</p>
                    <p className="text-gray-400 text-sm">JPG, PNG, GIF, MP4 (max 100MB)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept="image/*,video/mp4"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiInfo className="text-primary-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-primary-800">Important Note</h3>
                  <p className="text-primary-700 text-sm">
                    Once your NFT is minted on the blockchain, you cannot edit or update any of its information.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div>
            {/* Wallet Connection Status */}
            <div className="mb-6 p-4 border rounded-lg">
              <h3 className="font-medium mb-3 flex items-center">
                <FiZap className="mr-2" />
                Wallet Connection
              </h3>
              {wallet.isConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account:</span>
                    <span className="text-sm font-mono">
                      {wallet.account?.slice(0, 6)}...{wallet.account?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <span className="text-sm">{wallet.balance} ETH</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Network:</span>
                    <span className="text-sm">{wallet.network?.name}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Wallet Connected</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Connect your wallet to mint NFTs on the blockchain
                  </p>
                  <button
                    type="button"
                    onClick={wallet.connect}
                    disabled={wallet.isLoading}
                    className="btn-primary w-full"
                  >
                    {wallet.isLoading ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                  {wallet.error && (
                    <div className="mt-2">
                      <p className="text-red-500 text-sm">{wallet.error}</p>
                      {wallet.error.includes('MetaMask is not installed') && (
                        <button
                          type="button"
                          onClick={() => setShowMetaMaskGuide(true)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Show MetaMask Setup Guide
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="name" className="block font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Item name"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block font-medium mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[120px]"
                  placeholder="Provide a detailed description of your item"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="category" className="block font-medium mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  <option value="">Select a category</option>
                  <option value="art">Art</option>
                  <option value="collectibles">Collectibles</option>
                  <option value="music">Music</option>
                  <option value="photography">Photography</option>
                  <option value="sports">Sports</option>
                  <option value="virtual-worlds">Virtual Worlds</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="price" className="block font-medium mb-2">
                  Price (ETH) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input"
                  placeholder="0.1"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="royalty" className="block font-medium mb-2">
                  Royalty Percentage
                </label>
                <input
                  type="number"
                  id="royalty"
                  value={royaltyPercentage}
                  onChange={(e) => setRoyaltyPercentage(e.target.value)}
                  className="input"
                  placeholder="2.5"
                  step="0.1"
                  min="0"
                  max="10"
                />
                <p className="text-gray-500 text-sm mt-1">
                  Percentage you'll earn from future sales (0-10%)
                </p>
              </div>

              {/* Gas Estimation */}
              {wallet.isConnected && gasEstimate && (
                <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <FiDollarSign className="mr-2" />
                    Gas Estimation
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Gas Limit:</span>
                      <span>{gasEstimate.gasLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Price:</span>
                      <span>{(parseInt(gasEstimate.gasPrice) / 1e9).toFixed(2)} Gwei</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Estimated Cost:</span>
                      <span>{gasEstimate.estimatedCost} ETH</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Minting Progress */}
              {isSubmitting && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="font-medium">
                      {mintingStep === 'uploading' && 'Uploading to IPFS...'}
                      {mintingStep === 'minting' && 'Minting on blockchain...'}
                      {mintingStep === 'success' && 'NFT created successfully!'}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: mintingStep === 'uploading' ? '33%' :
                               mintingStep === 'minting' ? '66%' :
                               mintingStep === 'success' ? '100%' : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                className={`w-full py-3 text-lg font-medium rounded-lg transition-colors ${
                  !wallet.isConnected
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isSubmitting
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
                disabled={isSubmitting || !wallet.isConnected}
              >
                {!wallet.isConnected
                  ? 'Connect Wallet to Mint'
                  : isSubmitting
                  ? (mintingStep === 'uploading' ? 'Uploading...' :
                     mintingStep === 'minting' ? 'Minting...' : 'Creating...')
                  : 'Mint NFT on Blockchain'
                }
              </button>

              {!wallet.isConnected && (
                <p className="text-center text-gray-500 text-sm mt-2">
                  You need to connect your wallet to mint NFTs on the blockchain
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* MetaMask Setup Guide Modal */}
      {showMetaMaskGuide && (
        <MetaMaskGuide
          onClose={() => setShowMetaMaskGuide(false)}
          onRetry={() => {
            setShowMetaMaskGuide(false);
            wallet.connect();
          }}
        />
      )}
    </>
  );
}
