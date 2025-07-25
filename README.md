# 🎨 ArtMint NFT Marketplace

A comprehensive, production-ready NFT marketplace built with cutting-edge Web3 technologies. This full-stack decentralized application (dApp) enables users to mint, buy, sell, and auction NFTs on the Ethereum blockchain with real cryptocurrency transactions.

## 🌟 Key Features

### 🔗 Blockchain Integration
- **Real NFT Minting**: Create ERC-721 compliant NFTs on Ethereum blockchain
- **Smart Contract Marketplace**: Secure buying, selling, and auction functionality
- **MetaMask Integration**: Seamless wallet connection and transaction signing
- **Multi-Network Support**: Ethereum Mainnet, Sepolia, and Goerli testnets
- **Gas Optimization**: Efficient smart contracts with minimal transaction costs
- **Royalty System**: Automatic creator royalties (up to 10%) on secondary sales

### 🎨 NFT Management
- **IPFS Storage**: Decentralized metadata and image storage
- **Batch Minting**: Create multiple NFTs in a single transaction
- **Collection Management**: Organize NFTs into verified collections
- **Metadata Standards**: Full ERC-721 and OpenSea metadata compliance
- **Image Optimization**: Automatic image compression and format conversion

### 💰 Marketplace Features
- **Fixed Price Listings**: Direct buy/sell functionality
- **Auction System**: Time-based bidding with automatic settlement
- **Marketplace Fees**: Configurable platform fees (default 2.5%)
- **Price Discovery**: Real-time floor prices and volume tracking
- **Transaction History**: Complete on-chain transaction records

### 👥 Social Features
- **User Profiles**: Customizable creator and collector profiles
- **Follow System**: Follow favorite creators and collectors
- **Like & Comment**: Engage with NFT listings and collections
- **Verification System**: Verified creator badges and collection status
- **Activity Feed**: Real-time updates on marketplace activity

### 🔍 Discovery & Search
- **Advanced Search**: Filter by price, collection, creator, and attributes
- **Category Browsing**: Explore NFTs by art, gaming, music, and more
- **Trending Collections**: Discover popular and trending NFT collections
- **Creator Spotlight**: Featured artists and their latest works

### 🛡️ Security & Performance
- **Enterprise Security**: Input validation, rate limiting, and CSRF protection
- **Row Level Security**: Database-level access control with Supabase RLS
- **Performance Monitoring**: Real-time analytics and optimization
- **Mobile Responsive**: Optimized for all devices and screen sizes
- **Error Handling**: Comprehensive error boundaries and user feedback

### ⚡ Admin Panel
- **User Management**: View and manage user accounts and balances
- **Transaction Monitoring**: Track all marketplace transactions
- **Collection Verification**: Approve and verify NFT collections
- **Analytics Dashboard**: Comprehensive marketplace metrics and insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask browser extension
- Supabase account (for database)
- Ethereum testnet ETH (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/benjamindlabs/ArtMint.git
   cd nft-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Blockchain Configuration
   NEXT_PUBLIC_NETWORK=sepolia
   PRIVATE_KEY=your_wallet_private_key
   INFURA_PROJECT_ID=your_infura_project_id
   ETHERSCAN_API_KEY=your_etherscan_api_key

   # IPFS Configuration
   NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_key
   ```

4. **Database Setup**
   ```bash
   # Run the database setup script
   npm run setup:database
   ```

5. **Smart Contract Deployment**
   ```bash
   # Compile contracts
   npm run compile

   # Deploy to testnet
   npm run deploy:sepolia
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see your marketplace!

## 🏗️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router and server-side rendering
- **TypeScript**: Type-safe development with full IntelliSense support
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Icons**: Comprehensive icon library for modern interfaces
- **React Toastify**: Beautiful toast notifications for user feedback

### Blockchain
- **Solidity**: Smart contract development language
- **Hardhat**: Ethereum development environment and testing framework
- **Ethers.js v5**: Ethereum library for blockchain interactions
- **OpenZeppelin**: Security-audited smart contract libraries
- **IPFS**: Decentralized storage for NFT metadata and images

### Backend & Database
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Row Level Security**: Database-level access control and permissions
- **RESTful APIs**: Clean API design with proper error handling
- **Authentication**: Secure user authentication with JWT tokens

### Development Tools
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting and consistency
- **TypeScript**: Static type checking and IntelliSense
- **Git Hooks**: Pre-commit validation and testing

## 📁 Project Structure

```
nft-marketplace/
├── contracts/                 # Smart contracts
│   ├── ArtMintNFT.sol        # ERC-721 NFT contract
│   ├── ArtMintMarketplace.sol # Marketplace contract
│   └── ...
├── src/
│   ├── components/           # Reusable React components
│   ├── pages/               # Next.js pages and API routes
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── contexts/            # React context providers
│   ├── types/               # TypeScript type definitions
│   └── styles/              # Global styles and Tailwind config
├── scripts/                 # Deployment and utility scripts
├── public/                  # Static assets
└── supabase/               # Database migrations and functions
```

## 🔧 Smart Contracts

### ArtMintNFT Contract
Our ERC-721 compliant NFT contract with advanced features:

```solidity
// Key Features:
- ERC-721 standard compliance
- Built-in royalty system (EIP-2981)
- Batch minting capabilities
- Pausable for emergency stops
- Gas-optimized operations
- Maximum supply controls
```

**Contract Address (Sepolia)**: `0x...` (Update after deployment)

### ArtMintMarketplace Contract
Secure marketplace for trading NFTs:

```solidity
// Key Features:
- Fixed price listings
- Auction system with bidding
- Automatic royalty distribution
- Marketplace fee collection (2.5%)
- Reentrancy protection
- Emergency pause functionality
```

**Contract Address (Sepolia)**: `0x...` (Update after deployment)

## 🎯 Usage Guide

### For Creators

1. **Connect Your Wallet**
   - Install MetaMask browser extension
   - Connect to Sepolia testnet
   - Get test ETH from faucet

2. **Create Your First NFT**
   - Navigate to `/create`
   - Upload your artwork (JPG, PNG, GIF, MP4)
   - Add title, description, and properties
   - Set royalty percentage (0-10%)
   - Mint on blockchain

3. **List for Sale**
   - Go to your profile
   - Select an NFT you own
   - Choose fixed price or auction
   - Set your price and duration

### For Collectors

1. **Browse the Marketplace**
   - Explore trending collections
   - Use search and filters
   - Check creator profiles

2. **Purchase NFTs**
   - Click "Buy Now" for fixed price
   - Place bids on auctions
   - Confirm transaction in MetaMask

3. **Manage Your Collection**
   - View owned NFTs in profile
   - Track transaction history
   - Resell or transfer NFTs

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Blockchain
npm run compile         # Compile smart contracts
npm run deploy:local    # Deploy to local Hardhat network
npm run deploy:sepolia  # Deploy to Sepolia testnet
npm run deploy:goerli   # Deploy to Goerli testnet

# Database
npm run setup:database  # Initialize database schema
npm run deploy:social   # Deploy social features
```

### Testing

```bash
# Run smart contract tests
npx hardhat test

# Run frontend tests
npm run test

# Run integration tests
npm run test:integration
```

### Local Development Setup

1. **Start Local Blockchain**
   ```bash
   npx hardhat node
   ```

2. **Deploy Contracts Locally**
   ```bash
   npm run deploy:local
   ```

3. **Configure MetaMask**
   - Add local network (http://localhost:8545)
   - Import test accounts from Hardhat

## 🔐 Security Features

### Smart Contract Security
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Access Control**: Owner-only administrative functions
- **Input Validation**: Comprehensive parameter checking
- **Emergency Pause**: Circuit breaker for critical issues
- **Gas Optimization**: Efficient code to minimize costs

### Application Security
- **Input Sanitization**: All user inputs are validated and sanitized
- **Rate Limiting**: Prevents spam and abuse
- **CSRF Protection**: Cross-site request forgery prevention
- **SQL Injection Prevention**: Parameterized queries and ORM
- **XSS Protection**: Content Security Policy and output encoding

### Database Security
- **Row Level Security**: Supabase RLS for data access control
- **Encrypted Storage**: Sensitive data encryption at rest
- **Audit Logging**: Complete transaction and modification history
- **Backup Strategy**: Automated daily backups with point-in-time recovery

## 📊 Performance Optimizations

### Frontend Performance
- **Image Optimization**: Next.js automatic image optimization
- **Lazy Loading**: Components and images loaded on demand
- **Code Splitting**: Automatic bundle splitting for faster loads
- **Caching Strategy**: Intelligent caching for static and dynamic content
- **Virtual Scrolling**: Efficient rendering of large NFT lists

### Blockchain Performance
- **Gas Optimization**: Optimized smart contract code
- **Batch Operations**: Multiple operations in single transaction
- **Event Indexing**: Efficient blockchain event querying
- **Caching Layer**: Database caching for blockchain data

## 🌐 Deployment

### Production Deployment

1. **Environment Variables**
   ```bash
   # Production environment setup
   NEXT_PUBLIC_NETWORK=mainnet
   NEXT_PUBLIC_SUPABASE_URL=your_production_url
   # ... other production variables
   ```

2. **Deploy to Vercel**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Deploy Smart Contracts**
   ```bash
   npm run deploy:mainnet
   ```

### Monitoring & Analytics
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: Real-time performance metrics
- **User Analytics**: Privacy-focused user behavior tracking
- **Transaction Monitoring**: Blockchain transaction status tracking

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ | - |
| `NEXT_PUBLIC_NETWORK` | Ethereum network | ✅ | `sepolia` |
| `PRIVATE_KEY` | Deployer wallet private key | ✅ | - |
| `INFURA_PROJECT_ID` | Infura project ID | ✅ | - |
| `ETHERSCAN_API_KEY` | Etherscan API key | ❌ | - |
| `PINATA_API_KEY` | Pinata IPFS API key | ✅ | - |
| `PINATA_SECRET_API_KEY` | Pinata IPFS secret key | ✅ | - |

### Network Configuration

```javascript
// Supported Networks
const networks = {
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
  },
  goerli: {
    chainId: 5,
    name: "Goerli Testnet",
    rpcUrl: "https://goerli.infura.io/v3/YOUR_PROJECT_ID"
  }
};
```

## 🐛 Troubleshooting

### Common Issues

**MetaMask Connection Issues**
```bash
# Clear browser cache and cookies
# Restart MetaMask extension
# Check network configuration
```

**Transaction Failures**
```bash
# Insufficient gas limit
# Network congestion
# Incorrect contract address
# Insufficient ETH balance
```

**IPFS Upload Failures**
```bash
# Check Pinata API credentials
# Verify file size limits
# Check network connectivity
```

**Database Connection Issues**
```bash
# Verify Supabase credentials
# Check RLS policies
# Validate environment variables
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment variable
DEBUG=true npm run dev
```

## 📚 API Reference

### REST API Endpoints

```bash
# NFT Management
GET    /api/nfts              # Get all NFTs
GET    /api/nfts/:id          # Get specific NFT
POST   /api/nfts              # Create new NFT
PUT    /api/nfts/:id          # Update NFT
DELETE /api/nfts/:id          # Delete NFT

# User Management
GET    /api/users             # Get all users
GET    /api/users/:id         # Get specific user
PUT    /api/users/:id         # Update user profile

# Marketplace
GET    /api/marketplace       # Get marketplace listings
POST   /api/marketplace       # Create new listing
PUT    /api/marketplace/:id   # Update listing
DELETE /api/marketplace/:id   # Remove listing

# Collections
GET    /api/collections       # Get all collections
POST   /api/collections       # Create collection
PUT    /api/collections/:id   # Update collection
```

### WebSocket Events

```javascript
// Real-time marketplace updates
socket.on('nft:listed', (data) => {
  // New NFT listed
});

socket.on('nft:sold', (data) => {
  // NFT sold
});

socket.on('bid:placed', (data) => {
  // New bid placed
});
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
   ```bash
   git fork https://github.com/benjamindlabs/ArtMint.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow coding standards
   - Add tests for new features
   - Update documentation

4. **Run Tests**
   ```bash
   npm run test
   npm run lint
   ```

5. **Submit Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots if applicable

### Development Guidelines

- **Code Style**: Follow ESLint and Prettier configurations
- **Commit Messages**: Use conventional commit format
- **Testing**: Maintain 80%+ test coverage
- **Documentation**: Update README for new features
- **Security**: Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin**: Security-audited smart contract libraries
- **Hardhat**: Ethereum development environment
- **Next.js**: React framework for production
- **Supabase**: Backend-as-a-Service platform
- **Tailwind CSS**: Utility-first CSS framework
- **Ethers.js**: Ethereum library for Web3 interactions

## 📞 Support

### Documentation
- [Smart Contract Documentation](./docs/contracts.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./BLOCKCHAIN_DEPLOYMENT.md)
- [Admin Setup Guide](./ADMIN-SETUP.md)
- [MetaMask Setup Guide](./METAMASK_SETUP.md)

### Community
- **Discord**: [Join our community](https://discord.gg/your-server)
- **Twitter**: [@ArtMintNFT](https://twitter.com/artmintnft)
- **GitHub Issues**: [Report bugs](https://github.com/benjamindlabs/artmint/issues)
- **Email**: support@artmint.io

### Professional Support
For enterprise support and custom development:
- **Email**: enterprise@artmint.io
- **Website**: [https://artmint.io](https://artmint.io)

---

**Built with ❤️ by BENJAMINDLABS**

*Empowering creators and collectors in the decentralized digital art ecosystem.*
