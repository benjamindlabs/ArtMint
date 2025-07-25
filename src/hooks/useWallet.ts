import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getProvider, getSigner, getCurrentAccount, getNetworkInfo, isWalletConnected } from '../utils/realBlockchain';

interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  network: { chainId: number; name: string } | null;
  isLoading: boolean;
  error: string | null;
}

interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

export const useWallet = (): WalletState & WalletActions => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    account: null,
    balance: null,
    network: null,
    isLoading: false,
    error: null
  });

  // Get user's ETH balance
  const getBalance = useCallback(async (account: string) => {
    try {
      const provider = getProvider();
      if (!provider) return null;
      
      const balance = await provider.getBalance(account);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (state.account) {
      const balance = await getBalance(state.account);
      setState(prev => ({ ...prev, balance }));
    }
  }, [state.account, getBalance]);

  // Connect wallet
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask browser extension from https://metamask.io to continue.');
      }

      // Check if MetaMask is the provider
      if (!window.ethereum.isMetaMask) {
        throw new Error('Please use MetaMask as your Web3 provider. Other wallets may not be fully supported.');
      }

      // Request account access
      await getSigner();
      
      // Get account info
      const account = await getCurrentAccount();
      const network = await getNetworkInfo();
      const balance = account ? await getBalance(account) : null;
      
      setState({
        isConnected: true,
        account,
        balance,
        network,
        isLoading: false,
        error: null
      });

      // Store connection state
      localStorage.setItem('walletConnected', 'true');
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet'
      }));
    }
  }, [getBalance]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      account: null,
      balance: null,
      network: null,
      isLoading: false,
      error: null
    });
    
    localStorage.removeItem('walletConnected');
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      // Update network info after switch
      const network = await getNetworkInfo();
      setState(prev => ({ ...prev, network }));
      
    } catch (error: any) {
      console.error('Error switching network:', error);
      
      // If network doesn't exist, try to add it
      if (error.code === 4902) {
        await addNetwork(chainId);
      } else {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to switch network'
        }));
      }
    }
  }, []);

  // Add network to MetaMask
  const addNetwork = async (chainId: number) => {
    const networks: { [key: number]: any } = {
      11155111: { // Sepolia
        chainId: '0xaa36a7',
        chainName: 'Sepolia Test Network',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io/'],
      },
      5: { // Goerli
        chainId: '0x5',
        chainName: 'Goerli Test Network',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://goerli.infura.io/v3/'],
        blockExplorerUrls: ['https://goerli.etherscan.io/'],
      },
    };

    const networkConfig = networks[chainId];
    if (!networkConfig) {
      throw new Error('Unsupported network');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
    } catch (error: any) {
      console.error('Error adding network:', error);
      throw error;
    }
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      
      if (wasConnected && window.ethereum) {
        try {
          const connected = await isWalletConnected();
          if (connected) {
            const account = await getCurrentAccount();
            const network = await getNetworkInfo();
            const balance = account ? await getBalance(account) : null;
            
            setState({
              isConnected: true,
              account,
              balance,
              network,
              isLoading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('Error checking existing connection:', error);
        }
      }
    };

    checkConnection();
  }, [getBalance]);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== state.account) {
          setState(prev => ({ ...prev, account: accounts[0] }));
          // Refresh balance for new account
          getBalance(accounts[0]).then(balance => {
            setState(prev => ({ ...prev, balance }));
          });
        }
      };

      const handleChainChanged = (chainId: string) => {
        // Reload the page when chain changes to avoid state issues
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [state.account, disconnect, getBalance]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (state.isConnected && state.account) {
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [state.isConnected, state.account, refreshBalance]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
