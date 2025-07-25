import { useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiUpload, FiX, FiCheck, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useWallet';
import { createNFTMetadata } from '../../utils/ipfs';
import { mintNFT } from '../../utils/realBlockchain';
import { NFTDatabase } from '../../utils/nftDatabase';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface BatchItem {
  id: string;
  file: File;
  name: string;
  description: string;
  price: string;
  attributes: Array<{ trait_type: string; value: string }>;
  status: 'pending' | 'uploading' | 'minting' | 'success' | 'error';
  error?: string;
  tokenId?: number;
  transactionHash?: string;
}

export default function BatchUploadPage() {
  const { user } = useAuth();
  const wallet = useWallet();
  const router = useRouter();
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState<string | null>(null);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: BatchItem[] = acceptedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: '',
      price: '0.01',
      attributes: [],
      status: 'pending'
    }));

    setItems(prev => [...prev, ...newItems]);
  }, []);

  // Update item
  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Process all items
  const processAllItems = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!user) {
      toast.error('Please sign in to create NFTs');
      return;
    }

    setIsProcessing(true);
    
    for (const item of items) {
      if (item.status !== 'pending') continue;

      setCurrentProcessing(item.id);
      updateItem(item.id, { status: 'uploading' });

      try {
        // Upload to IPFS
        const metadataResult = await createNFTMetadata(
          item.file,
          item.name,
          item.description,
          item.attributes
        );

        if (!metadataResult.success) {
          throw new Error(metadataResult.error || 'Failed to upload to IPFS');
        }

        updateItem(item.id, { status: 'minting' });

        // Mint NFT
        const mintResult = await mintNFT(
          wallet.account!,
          metadataResult.metadataUrl!,
          wallet.account!,
          250 // 2.5% royalty
        );

        if (!mintResult.success) {
          throw new Error(mintResult.error || 'Failed to mint NFT');
        }

        // Save to database
        const nftData = {
          tokenId: mintResult.tokenId!,
          contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '',
          name: item.name,
          description: item.description,
          imageUrl: metadataResult.imageUrl!,
          metadataUrl: metadataResult.metadataUrl!,
          creatorId: user.id,
          ownerId: user.id,
          price: parseFloat(item.price),
          currency: 'ETH',
          isListed: true,
          transactionHash: mintResult.transactionHash,
          gasUsed: mintResult.gasUsed,
          royaltyPercentage: 2.5,
          attributes: item.attributes.map(attr => ({
            traitType: attr.trait_type,
            value: attr.value
          }))
        };

        await NFTDatabase.createNFT(nftData);

        updateItem(item.id, { 
          status: 'success',
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash
        });

        toast.success(`✅ ${item.name} created successfully!`);

      } catch (error: any) {
        console.error(`Error processing ${item.name}:`, error);
        updateItem(item.id, { 
          status: 'error',
          error: error.message 
        });
        toast.error(`❌ Failed to create ${item.name}: ${error.message}`);
      }
    }

    setCurrentProcessing(null);
    setIsProcessing(false);
    toast.success('🎉 Batch upload completed!');
  };

  return (
    <>
      <Head>
        <title>Batch Upload | NFT Marketplace</title>
        <meta name="description" content="Upload multiple NFTs at once" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
            >
              <FiArrowLeft className="mr-2" />
              Back to Dashboard
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Batch Upload NFTs
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Upload and mint multiple NFTs efficiently
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Supports JPG, PNG, GIF, MP4, WebM (max 100MB each)
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    onDrop(Array.from(e.target.files));
                  }
                }}
              />
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Items to Upload ({items.length})
                  </h2>
                  <button
                    onClick={processAllItems}
                    disabled={isProcessing || !wallet.isConnected}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Upload All'}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Preview */}
                      <div className="flex-shrink-0">
                        <img
                          src={URL.createObjectURL(item.file)}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              disabled={item.status !== 'pending'}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Price (ETH)
                            </label>
                            <input
                              type="number"
                              step="0.001"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, { price: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              disabled={item.status !== 'pending'}
                            />
                          </div>

                          <div className="flex items-end">
                            {/* Status */}
                            <div className="flex items-center space-x-2">
                              {item.status === 'pending' && (
                                <span className="text-gray-500">Ready</span>
                              )}
                              {item.status === 'uploading' && (
                                <span className="text-blue-500">Uploading...</span>
                              )}
                              {item.status === 'minting' && (
                                <span className="text-purple-500">Minting...</span>
                              )}
                              {item.status === 'success' && (
                                <span className="text-green-500 flex items-center">
                                  <FiCheck className="mr-1" /> Success
                                </span>
                              )}
                              {item.status === 'error' && (
                                <span className="text-red-500 flex items-center">
                                  <FiAlertCircle className="mr-1" /> Error
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={item.status !== 'pending'}
                          />
                        </div>

                        {/* Error message */}
                        {item.error && (
                          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                            {item.error}
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      {item.status === 'pending' && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
