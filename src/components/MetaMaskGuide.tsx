/**
 * MetaMask Installation and Setup Guide Component
 */

import { useState } from 'react';
import { FiDownload, FiExternalLink, FiCheck, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface MetaMaskGuideProps {
  onClose?: () => void;
  onRetry?: () => void;
}

const MetaMaskGuide: React.FC<MetaMaskGuideProps> = ({ onClose, onRetry }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isChecking, setIsChecking] = useState(false);

  const checkMetaMaskInstallation = async () => {
    setIsChecking(true);
    
    // Wait a moment for any recent installations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
      setCurrentStep(4); // Success step
      if (onRetry) {
        setTimeout(onRetry, 1500);
      }
    } else {
      setCurrentStep(1); // Back to installation step
    }
    
    setIsChecking(false);
  };

  const steps = [
    {
      id: 1,
      title: "Install MetaMask",
      description: "Download and install the MetaMask browser extension",
      action: (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <FiDownload className="mr-2" />
          Download MetaMask
          <FiExternalLink className="ml-2 w-4 h-4" />
        </a>
      )
    },
    {
      id: 2,
      title: "Create or Import Wallet",
      description: "Set up your MetaMask wallet by creating a new wallet or importing an existing one",
      action: (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>• Click "Create a Wallet" for new users</p>
          <p>• Or "Import Wallet" if you have a seed phrase</p>
          <p>• Set a strong password</p>
          <p>• Save your seed phrase securely</p>
        </div>
      )
    },
    {
      id: 3,
      title: "Connect to Ethereum Network",
      description: "Ensure MetaMask is connected to the correct network",
      action: (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>• Open MetaMask extension</p>
          <p>• Click the network dropdown (top center)</p>
          <p>• Select "Ethereum Mainnet" or "Sepolia Testnet"</p>
          <p>• For testing, use Sepolia testnet</p>
        </div>
      )
    },
    {
      id: 4,
      title: "Ready to Connect!",
      description: "MetaMask is installed and ready to use",
      action: (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <FiCheck className="mr-2" />
          <span>MetaMask detected successfully!</span>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mr-4">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                  alt="MetaMask" 
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  MetaMask Setup Guide
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Get started with Web3 and NFTs
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* What is MetaMask */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What is MetaMask?
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              MetaMask is a cryptocurrency wallet and gateway to blockchain apps. It allows you to:
            </p>
            <ul className="text-blue-800 dark:text-blue-200 text-sm mt-2 ml-4">
              <li>• Store and manage Ethereum and other cryptocurrencies</li>
              <li>• Interact with decentralized applications (dApps)</li>
              <li>• Buy, sell, and trade NFTs</li>
              <li>• Sign blockchain transactions securely</li>
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentStep === step.id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : currentStep > step.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
                }`}
              >
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {currentStep > step.id ? <FiCheck /> : step.id}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {step.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {step.description}
                    </p>
                    {step.action}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Check Installation Button */}
          <div className="mt-8 text-center">
            <button
              onClick={checkMetaMaskInstallation}
              disabled={isChecking}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" />
                  Check Installation
                </>
              )}
            </button>
          </div>

          {/* Alternative Wallets */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Alternative Wallets (Coming Soon)
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              While MetaMask is currently required, we're working on supporting additional wallets:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-500">
              <div>• WalletConnect</div>
              <div>• Coinbase Wallet</div>
              <div>• Trust Wallet</div>
              <div>• Rainbow Wallet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaMaskGuide;
