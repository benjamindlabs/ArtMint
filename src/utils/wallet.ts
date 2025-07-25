/**
 * Modern wallet connection utilities
 * Compatible with current ethers v5 setup while providing upgrade path
 */

import { ethers } from 'ethers';
import { env } from './env';

// Wallet connection state
interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
}

// Supported networks
export const SUPPORTED_NETWORKS = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://etherscan.io',
  },
  goerli: {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://goerli.etherscan.io',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
  },
} as const;

// Get current network
export const getCurrentNetwork = () => {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  return Object.values(SUPPORTED_NETWORKS).find(network => network.chainId === chainId) || SUPPORTED_NETWORKS.localhost;
};

// Wallet connection class
export class WalletConnection {
  private state: WalletState = {
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    provider: null,
    signer: null,
  };

  private listeners: Array<(state: WalletState) => void> = [];

  // Subscribe to state changes
  subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify listeners of state changes
  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Get current state
  getState(): WalletState {
    return { ...this.state };
  }

  // Check if MetaMask is installed
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  // Connect to wallet
  async connect(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isMetaMaskInstalled()) {
        return {
          success: false,
          error: 'MetaMask is not installed. Please install MetaMask to continue.',
        };
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts found. Please make sure your wallet is unlocked.',
        };
      }

      // Create provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      // Update state
      this.state = {
        isConnected: true,
        address,
        chainId: network.chainId,
        balance: ethers.utils.formatEther(balance),
        provider,
        signer,
      };

      // Set up event listeners
      this.setupEventListeners();

      this.notify();

      return { success: true };
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect wallet',
      };
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    this.state = {
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      provider: null,
      signer: null,
    };

    this.notify();
  }

  // Switch network
  async switchNetwork(chainId: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isMetaMaskInstalled()) {
        return {
          success: false,
          error: 'MetaMask is not installed',
        };
      }

      const hexChainId = `0x${chainId.toString(16)}`;

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error switching network:', error);
      return {
        success: false,
        error: error.message || 'Failed to switch network',
      };
    }
  }

  // Setup event listeners for wallet changes
  private setupEventListeners() {
    if (!window.ethereum) return;

    // Account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.connect();
      }
    });

    // Chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      this.connect(); // Reconnect to update chain info
    });

    // Disconnect
    window.ethereum.on('disconnect', () => {
      this.disconnect();
    });
  }

  // Get balance for specific address
  async getBalance(address?: string): Promise<string | null> {
    try {
      if (!this.state.provider) return null;

      const targetAddress = address || this.state.address;
      if (!targetAddress) return null;

      const balance = await this.state.provider.getBalance(targetAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  }

  // Sign message
  async signMessage(message: string): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!this.state.signer) {
        return {
          success: false,
          error: 'Wallet not connected',
        };
      }

      const signature = await this.state.signer.signMessage(message);
      return {
        success: true,
        signature,
      };
    } catch (error: any) {
      console.error('Error signing message:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign message',
      };
    }
  }
}

// Global wallet instance
export const wallet = new WalletConnection();

// Utility functions
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance: string | null): string => {
  if (!balance) return '0.000';
  const num = parseFloat(balance);
  return num.toFixed(3);
};


