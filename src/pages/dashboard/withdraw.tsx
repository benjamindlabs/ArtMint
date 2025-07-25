import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const WithdrawPage = () => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Network fee (this would be dynamic in a real app)
  const networkFee = 0.002;

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setError(null);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setError(null);
  };

  const setMaxAmount = () => {
    const maxAmount = Math.max(0, (profile.balance_eth || 0) - networkFee);
    setAmount(maxAmount > 0 ? maxAmount.toString() : '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Validate balance
    if (amountNum + networkFee > (profile.balance_eth || 0)) {
      setError('Insufficient balance including network fee');
      return;
    }

    // Validate address
    if (!address || !address.startsWith('0x') || address.length < 42) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setIsSubmitting(true);

    // In a real app, this would call a function to process the withdrawal
    // For this demo, we'll just simulate a delay
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/dashboard?withdraw=success');
    }, 2000);
  };

  // Calculate amount user will receive
  const amountToReceive = parseFloat(amount) > 0 ? parseFloat(amount) - networkFee : 0;

  return (
    <>
      <Head>
        <title>Withdraw | ArtMint NFT Marketplace</title>
        <meta name="description" content="Withdraw funds from your ArtMint wallet" />
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Withdraw Funds</h1>
            
            <div className="mb-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex">
                <FiInfo className="text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 dark:text-blue-400 text-sm">
                  Withdraw ETH from your wallet to an external address. Make sure to double-check the destination address before confirming.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex">
                <FiAlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Available Balance</h2>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Available</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{profile.balance_eth || 0} ETH</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destination Address
                </label>
                <input
                  id="address"
                  type="text"
                  placeholder="0x..."
                  value={address}
                  onChange={handleAddressChange}
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Double-check this address. Funds sent to the wrong address cannot be recovered.
                </p>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount to Withdraw (ETH)
                  </label>
                  <button 
                    type="button" 
                    onClick={setMaxAmount}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    Max
                  </button>
                </div>
                <input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Min: 0.01 ETH
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Max: {Math.max(0, (profile.balance_eth || 0) - networkFee).toFixed(4)} ETH
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Network Fee</span>
                    <span className="text-gray-900 dark:text-white">{networkFee} ETH</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-600 dark:text-gray-400">You will receive</span>
                    <span className="text-gray-900 dark:text-white">{amountToReceive.toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || !address}
                className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Withdraw'}
              </button>
            </form>

            <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
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
                  Your withdrawal transactions will appear here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawPage;
