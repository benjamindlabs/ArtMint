@echo off
echo Installing NFT Marketplace dependencies...

echo Creating necessary directories...
mkdir public\images 2>nul

echo Creating placeholder images...
echo Creating placeholder > public\images\nft1.jpg
echo Creating placeholder > public\images\nft2.jpg
echo Creating placeholder > public\images\nft3.jpg
echo Creating placeholder > public\images\nft4.jpg
echo Creating placeholder > public\images\nft5.jpg
echo Creating placeholder > public\images\nft6.jpg
echo Creating placeholder > public\images\collection1.jpg
echo Creating placeholder > public\images\collection2.jpg
echo Creating placeholder > public\images\collection3.jpg
echo Creating placeholder > public\images\collection4.jpg
echo Creating placeholder > public\images\profile.jpg

echo Installing npm dependencies with legacy peer deps...
call npm install --legacy-peer-deps

echo Installing additional dependencies...
call npm install @openzeppelin/contracts --legacy-peer-deps

echo Setup complete! You can now start the development server with:
echo npm run dev
