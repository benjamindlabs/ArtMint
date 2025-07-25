@echo off
echo Installing dependencies for NFT Marketplace...

echo Creating public directory and placeholder images...
mkdir public\images

echo Installing npm dependencies...
npm install --legacy-peer-deps

echo Installing OpenZeppelin contracts for NFT development...
npm install @openzeppelin/contracts --legacy-peer-deps

echo Setup complete! You can now start the development server with:
echo npm run dev
