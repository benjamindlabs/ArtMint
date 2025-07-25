const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting ArtMint contract deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️  Warning: Low balance. Make sure you have enough ETH for deployment.");
  }

  try {
    // Deploy ArtMintNFT contract
    console.log("\n📦 Deploying ArtMintNFT contract...");
    const ArtMintNFT = await ethers.getContractFactory("ArtMintNFT");
    const nftContract = await ArtMintNFT.deploy(
      "ArtMint NFT",           // name
      "ARTMINT",              // symbol
      deployer.address        // initial owner
    );
    
    await nftContract.deployed();
    console.log("✅ ArtMintNFT deployed to:", nftContract.address);
    console.log("🔗 Transaction hash:", nftContract.deployTransaction.hash);

    // Deploy ArtMintMarketplace contract
    console.log("\n📦 Deploying ArtMintMarketplace contract...");
    const ArtMintMarketplace = await ethers.getContractFactory("ArtMintMarketplace");
    const marketplaceContract = await ArtMintMarketplace.deploy(
      deployer.address        // initial owner
    );
    
    await marketplaceContract.deployed();
    console.log("✅ ArtMintMarketplace deployed to:", marketplaceContract.address);
    console.log("🔗 Transaction hash:", marketplaceContract.deployTransaction.hash);

    // Set marketplace contract in NFT contract
    console.log("\n🔗 Linking contracts...");
    const setMarketplaceTx = await nftContract.setMarketplaceContract(marketplaceContract.address);
    await setMarketplaceTx.wait();
    console.log("✅ Marketplace contract set in NFT contract");

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log("\n🌐 Network:", network.name, "(Chain ID:", network.chainId + ")");

    // Prepare contract addresses for frontend
    const contractAddresses = {
      network: network.name,
      chainId: network.chainId,
      nftContract: {
        address: nftContract.address,
        name: "ArtMintNFT",
        symbol: "ARTMINT"
      },
      marketplaceContract: {
        address: marketplaceContract.address,
        name: "ArtMintMarketplace"
      },
      deployedAt: new Date().toISOString(),
      deployer: deployer.address
    };

    // Save contract addresses to file
    const contractsDir = path.join(__dirname, "..", "src", "contracts");
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    const addressesPath = path.join(contractsDir, "addresses.json");
    fs.writeFileSync(addressesPath, JSON.stringify(contractAddresses, null, 2));
    console.log("📄 Contract addresses saved to:", addressesPath);

    // Copy ABIs to frontend
    const artifactsDir = path.join(__dirname, "..", "src", "artifacts");
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    // Copy NFT contract ABI
    const nftArtifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ArtMintNFT.sol", "ArtMintNFT.json");
    const nftAbiPath = path.join(artifactsDir, "ArtMintNFT.json");
    if (fs.existsSync(nftArtifactPath)) {
      fs.copyFileSync(nftArtifactPath, nftAbiPath);
      console.log("📄 NFT contract ABI copied to frontend");
    }

    // Copy Marketplace contract ABI
    const marketplaceArtifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ArtMintMarketplace.sol", "ArtMintMarketplace.json");
    const marketplaceAbiPath = path.join(artifactsDir, "ArtMintMarketplace.json");
    if (fs.existsSync(marketplaceArtifactPath)) {
      fs.copyFileSync(marketplaceArtifactPath, marketplaceAbiPath);
      console.log("📄 Marketplace contract ABI copied to frontend");
    }

    // Update environment variables template
    const envTemplate = `
# Blockchain Configuration (Updated after deployment)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${nftContract.address}
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=${marketplaceContract.address}
NEXT_PUBLIC_CHAIN_ID=${network.chainId}
NEXT_PUBLIC_NETWORK=${network.name}

# Add these to your .env.local file
`;

    const envPath = path.join(__dirname, "..", "deployment.env");
    fs.writeFileSync(envPath, envTemplate);
    console.log("📄 Environment template saved to:", envPath);

    // Display deployment summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("=" .repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=" .repeat(60));
    console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId + ")");
    console.log("👤 Deployer:", deployer.address);
    console.log("🎨 NFT Contract:", nftContract.address);
    console.log("🛒 Marketplace Contract:", marketplaceContract.address);
    console.log("=" .repeat(60));
    
    console.log("\n📝 Next Steps:");
    console.log("1. Add the contract addresses to your .env.local file");
    console.log("2. Update your frontend to use the deployed contracts");
    console.log("3. Verify contracts on Etherscan (optional)");
    console.log("4. Test the minting and marketplace functionality");

    // Verification commands
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\n🔍 To verify contracts on Etherscan, run:");
      console.log(`npx hardhat verify --network ${network.name} ${nftContract.address} "ArtMint NFT" "ARTMINT" ${deployer.address}`);
      console.log(`npx hardhat verify --network ${network.name} ${marketplaceContract.address} ${deployer.address}`);
    }

    return {
      nftContract: nftContract.address,
      marketplaceContract: marketplaceContract.address,
      network: network.name,
      chainId: network.chainId
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = main;
