# 🚀 ArtMint Blockchain Deployment Guide

This guide will help you deploy the ArtMint smart contracts to Ethereum testnet and integrate them with your frontend.

## 📋 Prerequisites

1. **Node.js and npm** installed
2. **MetaMask wallet** with testnet ETH
3. **Infura or Alchemy account** for RPC access
4. **Etherscan account** for contract verification (optional)

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install @openzeppelin/contracts ethers@^5.7.0 @nomiclabs/hardhat-etherscan hardhat-gas-reporter
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

**Required for deployment:**
```env
# Your wallet private key (for deployment only)
PRIVATE_KEY=your_wallet_private_key_here

# RPC URLs (get from Infura/Alchemy)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY

# Optional: For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Get Testnet ETH

- **Sepolia**: https://sepoliafaucet.com/
- **Goerli**: https://goerlifaucet.com/

You'll need at least 0.1 ETH for deployment and testing.

## 🚀 Deployment

### 1. Compile Contracts

```bash
npm run compile
```

### 2. Deploy to Testnet

**Deploy to Sepolia (Recommended):**
```bash
npm run deploy:sepolia
```

**Deploy to Goerli:**
```bash
npm run deploy:goerli
```

**Deploy to Local Hardhat Network (for testing):**
```bash
npm run deploy:local
```

### 3. Update Environment Variables

After successful deployment, the script will create a `deployment.env` file with the contract addresses. Copy these values to your `.env.local`:

```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK=sepolia
```

## 🔍 Contract Verification (Optional)

To verify your contracts on Etherscan:

```bash
# Verify NFT Contract
npx hardhat verify --network sepolia <NFT_CONTRACT_ADDRESS> "ArtMint NFT" "ARTMINT" <DEPLOYER_ADDRESS>

# Verify Marketplace Contract
npx hardhat verify --network sepolia <MARKETPLACE_CONTRACT_ADDRESS> <DEPLOYER_ADDRESS>
```

## 🧪 Testing the Integration

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Connect Your Wallet

1. Go to http://localhost:3003/create
2. Click "Connect Wallet"
3. Approve the connection in MetaMask
4. Make sure you're on the correct network (Sepolia/Goerli)

### 3. Test NFT Minting

1. Fill out the NFT creation form
2. Upload an image file
3. Set a price and royalty percentage
4. Click "Mint NFT on Blockchain"
5. Confirm the transaction in MetaMask
6. Wait for confirmation

### 4. Test Marketplace Features

1. Go to the marketplace page
2. Try listing an NFT for sale
3. Test buying functionality
4. Check transaction history

## 📊 Contract Features

### ArtMintNFT Contract
- **ERC-721 compliant** NFT minting
- **Royalty support** (EIP-2981)
- **Batch minting** for verified creators
- **Pausable** for emergency stops
- **Upgradeable** ownership model

### ArtMintMarketplace Contract
- **Fixed price listings**
- **Auction system** with bidding
- **Royalty enforcement**
- **Marketplace fees** (2.5% default)
- **Secure payment handling**

## 🔒 Security Features

- **ReentrancyGuard** protection
- **Pausable** contracts for emergency stops
- **Access control** with owner permissions
- **Input validation** and error handling
- **Gas optimization** for cost efficiency

## 🛠️ Troubleshooting

### Common Issues

1. **"Insufficient funds" error**
   - Make sure you have enough ETH for gas fees
   - Check the gas estimation in the UI

2. **"User rejected transaction"**
   - User cancelled the transaction in MetaMask
   - Try again and confirm the transaction

3. **"Contract not deployed"**
   - Check that contract addresses are set in environment variables
   - Verify the contracts are deployed on the correct network

4. **"Network mismatch"**
   - Switch to the correct network in MetaMask
   - Check NEXT_PUBLIC_CHAIN_ID matches your network

### Gas Optimization Tips

- **Batch operations** when possible
- **Use appropriate gas limits** (the UI estimates automatically)
- **Monitor gas prices** and deploy during low-traffic times
- **Consider Layer 2** solutions for lower fees

## 📈 Next Steps

After successful deployment:

1. **Test thoroughly** on testnet before mainnet
2. **Set up monitoring** for contract events
3. **Implement analytics** for marketplace metrics
4. **Add more features** like collections and auctions
5. **Consider mainnet deployment** when ready

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure you're on the correct network
4. Check that contracts are properly deployed
5. Review the transaction logs in Etherscan

## 🎉 Success!

Once deployed and tested, your ArtMint marketplace will have:

- ✅ Real blockchain NFT minting
- ✅ Decentralized file storage (IPFS)
- ✅ Marketplace trading functionality
- ✅ Royalty payments for creators
- ✅ Gas estimation and optimization
- ✅ Mobile-responsive interface
- ✅ Production-ready security

Your users can now mint, buy, and sell NFTs on the Ethereum blockchain with real cryptocurrency transactions!
