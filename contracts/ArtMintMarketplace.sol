// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ArtMintMarketplace
 * @dev Marketplace contract for buying, selling, and auctioning NFTs
 */
contract ArtMintMarketplace is ReentrancyGuard, Pausable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _listingIdCounter;
    
    // Marketplace fee (in basis points, e.g., 250 = 2.5%)
    uint256 public marketplaceFee = 250;
    
    // Minimum listing price
    uint256 public minimumPrice = 0.001 ether;

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 createdAt;
    }

    struct Auction {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 startingPrice;
        uint256 currentBid;
        address currentBidder;
        uint256 endTime;
        bool active;
        uint256 createdAt;
    }

    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(address => mapping(uint256 => uint256)) public tokenToListing;
    
    // Events
    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    
    event NFTSold(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    
    event ListingCancelled(uint256 indexed listingId);
    
    event AuctionCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 startingPrice,
        uint256 endTime
    );
    
    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 bidAmount
    );
    
    event AuctionEnded(
        uint256 indexed listingId,
        address indexed winner,
        uint256 winningBid
    );

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
        _listingIdCounter.increment(); // Start from listing ID 1
    }

    /**
     * @dev List an NFT for sale
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(price >= minimumPrice, "Price below minimum");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(nftContract).getApproved(tokenId) == address(this), "Contract not approved");
        require(tokenToListing[nftContract][tokenId] == 0, "Token already listed");

        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();

        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            createdAt: block.timestamp
        });

        tokenToListing[nftContract][tokenId] = listingId;

        emit NFTListed(listingId, nftContract, tokenId, msg.sender, price);
        return listingId;
    }

    /**
     * @dev Buy an NFT from a listing
     */
    function buyNFT(uint256 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        // Mark listing as inactive
        listing.active = false;
        tokenToListing[listing.nftContract][listing.tokenId] = 0;

        // Calculate fees
        uint256 marketplaceFeeAmount = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - marketplaceFeeAmount;

        // Handle royalties if supported
        uint256 royaltyAmount = 0;
        address royaltyRecipient = address(0);
        
        try IERC721(listing.nftContract).supportsInterface(0x2a55205a) returns (bool supportsRoyalties) {
            if (supportsRoyalties) {
                // EIP-2981 royalty standard
                (bool success, bytes memory data) = listing.nftContract.call(
                    abi.encodeWithSignature("royaltyInfo(uint256,uint256)", listing.tokenId, listing.price)
                );
                if (success && data.length >= 64) {
                    (royaltyRecipient, royaltyAmount) = abi.decode(data, (address, uint256));
                    if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
                        sellerAmount -= royaltyAmount;
                    }
                }
            }
        } catch {}

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        // Transfer payments
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).transfer(royaltyAmount);
        }
        payable(listing.seller).transfer(sellerAmount);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit NFTSold(listingId, listing.nftContract, listing.tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender || msg.sender == owner(), "Not authorized");

        listing.active = false;
        tokenToListing[listing.nftContract][listing.tokenId] = 0;

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Create an auction
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(startingPrice >= minimumPrice, "Starting price below minimum");
        require(duration >= 1 hours && duration <= 7 days, "Invalid duration");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(nftContract).getApproved(tokenId) == address(this), "Contract not approved");
        require(tokenToListing[nftContract][tokenId] == 0, "Token already listed");

        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();

        auctions[listingId] = Auction({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            startingPrice: startingPrice,
            currentBid: 0,
            currentBidder: address(0),
            endTime: block.timestamp + duration,
            active: true,
            createdAt: block.timestamp
        });

        tokenToListing[nftContract][tokenId] = listingId;

        emit AuctionCreated(listingId, nftContract, tokenId, msg.sender, startingPrice, block.timestamp + duration);
        return listingId;
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 listingId) external payable nonReentrant whenNotPaused {
        Auction storage auction = auctions[listingId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Cannot bid on your own auction");
        
        uint256 minBid = auction.currentBid > 0 ? auction.currentBid + (auction.currentBid * 5 / 100) : auction.startingPrice;
        require(msg.value >= minBid, "Bid too low");

        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            payable(auction.currentBidder).transfer(auction.currentBid);
        }

        auction.currentBid = msg.value;
        auction.currentBidder = msg.sender;

        emit BidPlaced(listingId, msg.sender, msg.value);
    }

    /**
     * @dev End an auction
     */
    function endAuction(uint256 listingId) external nonReentrant {
        Auction storage auction = auctions[listingId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still ongoing");

        auction.active = false;
        tokenToListing[auction.nftContract][auction.tokenId] = 0;

        if (auction.currentBidder != address(0)) {
            // Calculate fees
            uint256 marketplaceFeeAmount = (auction.currentBid * marketplaceFee) / 10000;
            uint256 sellerAmount = auction.currentBid - marketplaceFeeAmount;

            // Handle royalties
            uint256 royaltyAmount = 0;
            address royaltyRecipient = address(0);
            
            try IERC721(auction.nftContract).supportsInterface(0x2a55205a) returns (bool supportsRoyalties) {
                if (supportsRoyalties) {
                    (bool success, bytes memory data) = auction.nftContract.call(
                        abi.encodeWithSignature("royaltyInfo(uint256,uint256)", auction.tokenId, auction.currentBid)
                    );
                    if (success && data.length >= 64) {
                        (royaltyRecipient, royaltyAmount) = abi.decode(data, (address, uint256));
                        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
                            sellerAmount -= royaltyAmount;
                        }
                    }
                }
            } catch {}

            // Transfer NFT to winner
            IERC721(auction.nftContract).safeTransferFrom(auction.seller, auction.currentBidder, auction.tokenId);

            // Transfer payments
            if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
                payable(royaltyRecipient).transfer(royaltyAmount);
            }
            payable(auction.seller).transfer(sellerAmount);

            emit AuctionEnded(listingId, auction.currentBidder, auction.currentBid);
        } else {
            emit AuctionEnded(listingId, address(0), 0);
        }
    }

    /**
     * @dev Update marketplace fee (only owner)
     */
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _fee;
    }

    /**
     * @dev Update minimum price (only owner)
     */
    function setMinimumPrice(uint256 _price) external onlyOwner {
        minimumPrice = _price;
    }

    /**
     * @dev Withdraw marketplace fees (only owner)
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get auction details
     */
    function getAuction(uint256 listingId) external view returns (Auction memory) {
        return auctions[listingId];
    }

    /**
     * @dev Get current listing ID counter
     */
    function getCurrentListingId() external view returns (uint256) {
        return _listingIdCounter.current();
    }
}
