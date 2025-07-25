import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiCopy, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const DepositPage = () => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to signin
  }

  // Mock wallet address if not set
  const walletAddress = profile.wallet_address || '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t';

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Deposit | ArtMint NFT Marketplace</title>
        <meta name="description" content="Deposit funds to your ArtMint wallet" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <FiArrowLeft className="mr-2" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Deposit Funds</h1>
            
            <div className="mb-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex">
                <FiInfo className="text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 dark:text-blue-400 text-sm">
                  Send ETH to your wallet address below. Only send ETH to this address. Sending other tokens may result in permanent loss.
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Deposit Address</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  <span>Network: Ethereum</span>
                </div>
              </div>

              <div className="mt-4 relative">
                <div className="overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div className="p-4 font-mono text-sm break-all">{walletAddress}</div>
                  <div className="absolute right-2 top-2">
                    <button
                      onClick={copyWalletAddress}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {copied ? (
                        <span className="text-green-500 text-sm font-medium">Copied!</span>
                      ) : (
                        <FiCopy className="text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="aspect-w-1 aspect-h-1 max-w-[200px] mx-auto bg-white p-4 rounded-lg">
                  {/* QR Code placeholder - in a real app, generate a QR code for the wallet address */}
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">QR Code</span>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Scan to copy address
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Balance</h2>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Available</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{profile.balance_eth || 0} ETH</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Transaction History</h2>
              
              {/* Empty state for transaction history */}
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium">No transactions yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Your deposit transactions will appear here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DepositPage;
