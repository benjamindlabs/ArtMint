@echo off
echo Fixing and setting up NFT Marketplace project...

echo Creating placeholder images...
mkdir public\images 2>nul
echo. > public\images\nft1.jpg
echo. > public\images\nft2.jpg
echo. > public\images\nft3.jpg
echo. > public\images\nft4.jpg
echo. > public\images\nft5.jpg
echo. > public\images\nft6.jpg
echo. > public\images\collection1.jpg
echo. > public\images\collection2.jpg
echo. > public\images\collection3.jpg
echo. > public\images\collection4.jpg
echo. > public\images\profile.jpg

echo Creating artifacts directory for smart contracts...
mkdir src\artifacts\contracts\NFT.sol 2>nul
mkdir src\artifacts\contracts\NFTMarket.sol 2>nul

echo Creating placeholder contract artifacts...
echo { "abi": [] } > src\artifacts\contracts\NFT.sol\NFT.json
echo { "abi": [] } > src\artifacts\contracts\NFTMarket.sol\NFTMarket.json

echo Installing dependencies...
call npm install --legacy-peer-deps

echo Starting development server...
call npm run dev
