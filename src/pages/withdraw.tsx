import { useState } from 'react';
import Head from 'next/head';
import { FiAlertCircle, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/Layout';

export default function Withdraw() {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('ethereum');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Mock wallet balance
  const walletBalance = {
    ethereum: 2.5,
    polygon: 45.8
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    // In a real app, this would connect to the blockchain
    setShowConfirmation(true);
  };

  const handleMaxAmount = () => {
    setAmount(walletBalance[network].toString());
  };

  return (
    <Layout>
      <Head>
        <title>Withdraw | ArtMint NFT Marketplace</title>
        <meta name="description" content="Withdraw funds from your ArtMint wallet" />
      </Head>

      <div className="bg-gray-50 dark:bg-gray-900 py-8 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Withdraw</h1>

            {showConfirmation ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <FiCheckCircle className="text-green-600 dark:text-green-400 text-3xl" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-center mb-2">Withdrawal Initiated</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Your withdrawal of {amount} {network === 'ethereum' ? 'ETH' : 'MATIC'} to {address} has been initiated. Please wait for the blockchain confirmation.
                </p>
                <div className="text-center">
                  <button 
                    onClick={() => setShowConfirmation(false)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Return to Withdraw
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4">Select Network</h2>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button 
                      onClick={() => setNetwork('ethereum')}
                      className={`p-4 rounded-lg border ${
                        network === 'ethereum' 
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-300 dark:border-gray-700'
                      } flex items-center justify-center`}
                    >
                      <span className={network === 'ethereum' ? 'text-purple-600 dark:text-purple-400' : ''}>
                        Ethereum
                      </span>
                    </button>
                    <button 
                      onClick={() => setNetwork('polygon')}
                      className={`p-4 rounded-lg border ${
                        network === 'polygon' 
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-300 dark:border-gray-700'
                      } flex items-center justify-center`}
                    >
                      <span className={network === 'polygon' ? 'text-purple-600 dark:text-purple-400' : ''}>
                        Polygon
                      </span>
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Available Balance</h3>
                      <span className="font-medium">
                        {walletBalance[network]} {network === 'ethereum' ? 'ETH' : 'MATIC'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${(walletBalance[network] / (network === 'ethereum' ? 5 : 100)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <form onSubmit={handleWithdraw}>
                    <div className="mb-6">
                      <label htmlFor="address" className="block text-sm font-medium mb-2">
                        Withdrawal Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your wallet address"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="amount" className="block text-sm font-medium">
                          Amount to Withdraw
                        </label>
                        <button 
                          type="button" 
                          onClick={handleMaxAmount}
                          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Max
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          max={walletBalance[network]}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500">
                            {network === 'ethereum' ? 'ETH' : 'MATIC'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <FiAlertCircle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-yellow-800 dark:text-yellow-400">Important</h3>
                          <p className="text-yellow-700 dark:text-yellow-500 text-sm">
                            Please double-check the withdrawal address. Transactions cannot be reversed once confirmed on the blockchain.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Transaction Fee</h3>
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <span>Network Fee</span>
                        <span>{network === 'ethereum' ? '0.005 ETH' : '0.01 MATIC'}</span>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                      disabled={!amount || !address || parseFloat(amount) > walletBalance[network]}
                    >
                      Withdraw Now <FiArrowRight className="ml-2" />
                    </button>
                  </form>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Recent Withdrawals</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-4 text-sm">Apr 1, 2025</td>
                          <td className="py-4 text-sm">1.2 ETH</td>
                          <td className="py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Completed
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-4 text-sm">Mar 25, 2025</td>
                          <td className="py-4 text-sm">0.5 ETH</td>
                          <td className="py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Completed
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 text-sm">Mar 10, 2025</td>
                          <td className="py-4 text-sm">2.0 ETH</td>
                          <td className="py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Completed
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
