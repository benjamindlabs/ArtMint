/**
 * Real Blockchain Integration for ArtMint NFT Marketplace
 * This file contains functions for interacting with deployed smart contracts
 */

import { ethers } from 'ethers';

// Contract addresses - will be updated after deployment
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '';
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || '';

// Import contract ABIs
let NFT_ABI: any[] = [];
let MARKETPLACE_ABI: any[] = [];

// Load ABIs dynamically
const loadABIs = async () => {
  try {
    if (typeof window !== 'undefined') {
      const nftAbi = await import('../artifacts/contracts/NFT.sol/NFT.json');
      const marketplaceAbi = await import('../artifacts/contracts/NFTMarket.sol/NFTMarket.json');
      NFT_ABI = nftAbi.abi;
      MARKETPLACE_ABI = marketplaceAbi.abi;
    }
  } catch (error) {
    console.warn('Could not load contract ABIs, using fallback');
    // Fallback minimal ABIs
    NFT_ABI = [
      "function mintNFT(address to, string memory tokenURI, address royaltyRecipient, uint96 royaltyFraction) public payable returns (uint256)",
      "function ownerOf(uint256 tokenId) public view returns (address)",
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
      "function approve(address to, uint256 tokenId) public",
      "function setApprovalForAll(address operator, bool approved) public",
      "function transferFrom(address from, address to, uint256 tokenId) public",
      "function getCurrentTokenId() external view returns (uint256)",
      "function mintingFee() public view returns (uint256)"
    ];
    
    MARKETPLACE_ABI = [
      "function listNFT(address nftContract, uint256 tokenId, uint256 price) external returns (uint256)",
      "function buyNFT(uint256 listingId) external payable",
      "function cancelListing(uint256 listingId) external",
      "function getListing(uint256 listingId) external view returns (tuple(uint256,address,uint256,address,uint256,bool,uint256))",
      "function createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 duration) external returns (uint256)",
      "function placeBid(uint256 listingId) external payable",
      "function endAuction(uint256 listingId) external"
    ];
  }
};

// Initialize ABIs
loadABIs();

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface MintResult {
  success: boolean;
  tokenId?: number;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
}

export interface ListingResult {
  success: boolean;
  listingId?: string;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

// Get Web3 provider
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return null;
};

// Get signer (connected wallet)
export const getSigner = async () => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No Web3 provider found. Please install MetaMask.');
  }
  
  try {
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    }
    throw new Error('Failed to connect to wallet');
  }
};

// Get NFT contract instance
export const getNFTContract = async () => {
  if (!NFT_CONTRACT_ADDRESS) {
    throw new Error('NFT contract address not configured');
  }
  
  const signer = await getSigner();
  return new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
};

// Get Marketplace contract instance
export const getMarketplaceContract = async () => {
  if (!MARKETPLACE_CONTRACT_ADDRESS) {
    throw new Error('Marketplace contract address not configured');
  }
  
  const signer = await getSigner();
  return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
};

// Real NFT minting function
export const mintNFT = async (
  to: string,
  tokenURI: string,
  royaltyRecipient: string,
  royaltyFraction: number = 250 // 2.5% default
): Promise<MintResult> => {
  try {
    console.log('🎨 Minting NFT on blockchain...');
    console.log('To:', to);
    console.log('Token URI:', tokenURI);
    console.log('Royalty:', royaltyFraction / 100, '%');
    
    const contract = await getNFTContract();
    
    // Get minting fee
    const mintingFee = await contract.mintingFee();
    console.log('Minting fee:', ethers.utils.formatEther(mintingFee), 'ETH');
    
    // Estimate gas
    const gasEstimate = await contract.estimateGas.mintNFT(
      to,
      tokenURI,
      royaltyRecipient,
      royaltyFraction,
      { value: mintingFee }
    );
    
    console.log('Estimated gas:', gasEstimate.toString());
    
    // Execute transaction
    const tx = await contract.mintNFT(
      to,
      tokenURI,
      royaltyRecipient,
      royaltyFraction,
      { 
        value: mintingFee,
        gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
      }
    );
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);
    
    // Extract token ID from events
    const mintEvent = receipt.events?.find((event: any) => event.event === 'NFTMinted');
    const tokenId = mintEvent?.args?.tokenId?.toNumber();
    
    return {
      success: true,
      tokenId,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString()
    };
    
  } catch (error: any) {
    console.error('❌ Error minting NFT:', error);
    
    let errorMessage = 'Failed to mint NFT';
    if (error.code === 4001) {
      errorMessage = 'User rejected the transaction';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for minting fee and gas';
    } else if (error.message.includes('user rejected')) {
      errorMessage = 'Transaction was rejected';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// List NFT for sale on marketplace
export const listNFTForSale = async (
  tokenId: number,
  price: string
): Promise<ListingResult> => {
  try {
    console.log('🏪 Listing NFT for sale...');
    console.log('Token ID:', tokenId);
    console.log('Price:', price, 'ETH');
    
    const nftContract = await getNFTContract();
    const marketplaceContract = await getMarketplaceContract();
    const signer = await getSigner();
    
    // Check if user owns the NFT
    const owner = await nftContract.ownerOf(tokenId);
    const userAddress = await signer.getAddress();
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error('You do not own this NFT');
    }
    
    // Check if marketplace is approved
    const isApproved = await nftContract.isApprovedForAll(userAddress, MARKETPLACE_CONTRACT_ADDRESS);
    
    if (!isApproved) {
      console.log('Approving marketplace...');
      const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_CONTRACT_ADDRESS, true);
      await approveTx.wait();
      console.log('Marketplace approved');
    }
    
    // Convert price to wei
    const priceInWei = ethers.utils.parseEther(price);
    
    // Estimate gas
    const gasEstimate = await marketplaceContract.estimateGas.listNFT(
      NFT_CONTRACT_ADDRESS,
      tokenId,
      priceInWei
    );
    
    // List NFT
    const tx = await marketplaceContract.listNFT(
      NFT_CONTRACT_ADDRESS,
      tokenId,
      priceInWei,
      { gasLimit: gasEstimate.mul(120).div(100) }
    );
    
    console.log('Listing transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Listing confirmed:', receipt.transactionHash);
    
    // Extract listing ID from events
    const listEvent = receipt.events?.find((event: any) => event.event === 'NFTListed');
    const listingId = listEvent?.args?.listingId?.toString();
    
    return {
      success: true,
      listingId,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString()
    };
    
  } catch (error: any) {
    console.error('❌ Error listing NFT:', error);
    
    let errorMessage = 'Failed to list NFT';
    if (error.code === 4001) {
      errorMessage = 'User rejected the transaction';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for gas';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Buy NFT from marketplace
export const buyNFT = async (
  listingId: string,
  price: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
  try {
    console.log('💰 Buying NFT...');
    console.log('Listing ID:', listingId);
    console.log('Price:', price, 'ETH');
    
    const marketplaceContract = await getMarketplaceContract();
    const priceInWei = ethers.utils.parseEther(price);
    
    // Estimate gas
    const gasEstimate = await marketplaceContract.estimateGas.buyNFT(listingId, {
      value: priceInWei
    });
    
    // Execute purchase
    const tx = await marketplaceContract.buyNFT(listingId, {
      value: priceInWei,
      gasLimit: gasEstimate.mul(120).div(100)
    });
    
    console.log('Purchase transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Purchase confirmed:', receipt.transactionHash);
    
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
    
  } catch (error: any) {
    console.error('❌ Error buying NFT:', error);
    
    let errorMessage = 'Failed to buy NFT';
    if (error.code === 4001) {
      errorMessage = 'User rejected the transaction';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Get gas estimate for transaction
export const getGasEstimate = async (
  contractMethod: string,
  params: any[]
): Promise<{ gasLimit: string; gasPrice: string; estimatedCost: string }> => {
  try {
    const provider = getProvider();
    if (!provider) throw new Error('No provider available');
    
    const gasPrice = await provider.getGasPrice();
    
    // Mock gas limit for estimation (would be calculated per method)
    const gasLimit = ethers.BigNumber.from('150000');
    const estimatedCost = ethers.utils.formatEther(gasLimit.mul(gasPrice));
    
    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      estimatedCost
    };
  } catch (error: any) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};

// Check transaction status
export const getTransactionStatus = async (txHash: string): Promise<TransactionStatus> => {
  try {
    const provider = getProvider();
    if (!provider) throw new Error('No provider available');
    
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { status: 'pending', confirmations: 0 };
    }
    
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    
    return {
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      confirmations,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice?.toString()
    };
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return { status: 'failed', confirmations: 0 };
  }
};

// Check if wallet is connected
export const isWalletConnected = async (): Promise<boolean> => {
  try {
    const provider = getProvider();
    if (!provider) return false;
    
    const accounts = await provider.listAccounts();
    return accounts.length > 0;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

// Get current account
export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    const provider = getProvider();
    if (!provider) return null;
    
    const accounts = await provider.listAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

// Get network information
export const getNetworkInfo = async () => {
  try {
    const provider = getProvider();
    if (!provider) return null;
    
    const network = await provider.getNetwork();
    return {
      chainId: network.chainId,
      name: network.name
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return null;
  }
};
