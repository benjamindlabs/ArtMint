import { ethers } from 'ethers';
import { wallet } from './wallet';
import { NFTDatabase, NFTData, TransactionData } from './nftDatabase';
import { env } from './env';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

// Contract addresses - these should be set via environment variables
const nftmarketaddress = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const nftaddress = process.env.NEXT_PUBLIC_NFT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Marketplace fee (2.5%)
const MARKETPLACE_FEE_PERCENTAGE = 2.5;

// Connect wallet using our modern wallet utility
export async function connectWallet() {
  try {
    const result = await wallet.connect();
    if (!result.success) {
      throw new Error(result.error || 'Failed to connect wallet');
    }

    const state = wallet.getState();
    return {
      provider: state.provider,
      signer: state.signer
    };
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw error;
  }
}

// Fetch market items from database instead of blockchain directly
export async function fetchMarketItems() {
  try {
    // Get listed NFTs from database
    const { data: nfts, error } = await NFTDatabase.getNFTs({
      isListed: true,
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit: 50
    });

    if (error) {
      console.error("Error fetching market items from database:", error);
      return [];
    }

    // Transform database format to expected format
    const items = nfts.map((nft: any) => ({
      id: nft.id,
      tokenId: nft.token_id.toString(),
      contractAddress: nft.contract_address,
      name: nft.name,
      description: nft.description,
      image: nft.image_url,
      price: nft.price ? nft.price.toString() : '0',
      currency: nft.currency || 'ETH',
      creator: nft.profiles?.username || 'Unknown',
      owner: nft.owner?.username || 'Unknown',
      creatorId: nft.creator_id,
      ownerId: nft.owner_id,
      collection: nft.collections?.name || null,
      isAuction: nft.is_auction,
      auctionEndTime: nft.auction_end_time,
      likes: nft.like_count || 0,
      views: nft.view_count || 0
    }));

    return items;
  } catch (error) {
    console.error("Error fetching market items:", error);
    return [];
  }
}

// Buy NFT with real blockchain integration and database updates
export async function buyNFT(nft: any, buyerId: string) {
  try {
    const walletState = wallet.getState();
    if (!walletState.isConnected || !walletState.signer) {
      throw new Error('Wallet not connected');
    }

    // Validate price
    const price = parseFloat(nft.price);
    if (isNaN(price) || price <= 0) {
      throw new Error('Invalid NFT price');
    }

    // Calculate fees
    const marketplaceFee = (price * MARKETPLACE_FEE_PERCENTAGE) / 100;
    const totalPrice = price + marketplaceFee;

    // Check user balance
    const balance = await wallet.getBalance();
    if (!balance || parseFloat(balance) < totalPrice) {
      throw new Error('Insufficient balance');
    }

    // Create transaction on blockchain (simplified for demo)
    const priceInWei = ethers.utils.parseEther(price.toString());
    const tx = await walletState.signer.sendTransaction({
      to: nft.ownerId, // In real implementation, this would be the marketplace contract
      value: priceInWei,
      gasLimit: 21000
    });

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    // Update database
    await NFTDatabase.updateNFT(nft.id, {
      ownerId: buyerId,
      isListed: false,
      price: undefined
    });

    // Record transaction
    await NFTDatabase.recordTransaction({
      nftId: nft.id,
      fromUserId: nft.ownerId,
      toUserId: buyerId,
      transactionHash: receipt.transactionHash,
      transactionType: 'sale',
      price: price,
      currency: 'ETH',
      gasFee: parseFloat(ethers.utils.formatEther(receipt.gasUsed.mul(tx.gasPrice || 0))),
      marketplaceFee: marketplaceFee,
      blockNumber: receipt.blockNumber
    });

    return { success: true, transactionHash: receipt.transactionHash };
  } catch (error: any) {
    console.error("Error buying NFT:", error);
    return { success: false, error: error.message };
  }
}

export async function createNFT(url: string, price: string) {
  try {
    const { signer } = await connectWallet();
    
    // Create token
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
    let transaction = await contract.createToken(url);
    const tx = await transaction.wait();
    
    // Get tokenId from the transaction
    const event = tx.events[0];
    const value = event.args[2];
    const tokenId = value.toString();
    
    const priceInWei = ethers.utils.parseEther(price);
    
    // List the item for sale on the marketplace
    contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);
    let listingPrice = await contract.getListingPrice();
    
    transaction = await contract.createMarketItem(
      nftaddress,
      tokenId,
      priceInWei,
      { value: listingPrice }
    );
    
    await transaction.wait();
    return true;
  } catch (error) {
    console.error("Error creating NFT:", error);
    return false;
  }
}
