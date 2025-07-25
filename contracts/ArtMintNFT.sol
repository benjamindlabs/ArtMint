// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ArtMintNFT
 * @dev NFT contract for ArtMint marketplace with minting, royalties, and marketplace integration
 */
contract ArtMintNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    // Marketplace contract address
    address public marketplaceContract;
    
    // Royalty info
    struct RoyaltyInfo {
        address recipient;
        uint96 royaltyFraction; // Basis points (e.g., 250 = 2.5%)
    }
    
    mapping(uint256 => RoyaltyInfo) private _tokenRoyalties;
    
    // Minting fee (in wei)
    uint256 public mintingFee = 0.001 ether;
    
    // Maximum supply
    uint256 public maxSupply = 100000;
    
    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI, uint256 royalty);
    event RoyaltySet(uint256 indexed tokenId, address indexed recipient, uint96 royaltyFraction);
    event MintingFeeUpdated(uint256 newFee);
    event MarketplaceContractUpdated(address newMarketplace);

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) {
        _transferOwnership(initialOwner);
        _tokenIdCounter.increment(); // Start from token ID 1
    }

    /**
     * @dev Mint a new NFT with metadata URI and royalty
     * @param to Address to mint the NFT to
     * @param tokenURI IPFS URI for the NFT metadata
     * @param royaltyRecipient Address to receive royalties
     * @param royaltyFraction Royalty percentage in basis points (e.g., 250 = 2.5%)
     */
    function mintNFT(
        address to,
        string memory tokenURI,
        address royaltyRecipient,
        uint96 royaltyFraction
    ) public payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value >= mintingFee, "Insufficient minting fee");
        require(_tokenIdCounter.current() <= maxSupply, "Maximum supply reached");
        require(royaltyFraction <= 1000, "Royalty fraction too high"); // Max 10%
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Set royalty info
        _tokenRoyalties[tokenId] = RoyaltyInfo(royaltyRecipient, royaltyFraction);
        
        emit NFTMinted(tokenId, to, tokenURI, royaltyFraction);
        emit RoyaltySet(tokenId, royaltyRecipient, royaltyFraction);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple NFTs (for verified creators)
     */
    function batchMintNFT(
        address to,
        string[] memory tokenURIs,
        address royaltyRecipient,
        uint96 royaltyFraction
    ) public payable nonReentrant whenNotPaused onlyOwner returns (uint256[] memory) {
        require(tokenURIs.length > 0, "No token URIs provided");
        require(_tokenIdCounter.current() + tokenURIs.length <= maxSupply, "Would exceed maximum supply");
        
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            _tokenRoyalties[tokenId] = RoyaltyInfo(royaltyRecipient, royaltyFraction);
            
            tokenIds[i] = tokenId;
            
            emit NFTMinted(tokenId, to, tokenURIs[i], royaltyFraction);
        }
        
        return tokenIds;
    }

    /**
     * @dev Get royalty information for a token
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_exists(tokenId), "Token does not exist");
        
        RoyaltyInfo memory royalty = _tokenRoyalties[tokenId];
        uint256 amount = (salePrice * royalty.royaltyFraction) / 10000;
        
        return (royalty.recipient, amount);
    }

    /**
     * @dev Update royalty for a token (only token owner)
     */
    function updateRoyalty(uint256 tokenId, address recipient, uint96 royaltyFraction) 
        external 
    {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(royaltyFraction <= 1000, "Royalty fraction too high");
        
        _tokenRoyalties[tokenId] = RoyaltyInfo(recipient, royaltyFraction);
        emit RoyaltySet(tokenId, recipient, royaltyFraction);
    }

    /**
     * @dev Set marketplace contract address (only owner)
     */
    function setMarketplaceContract(address _marketplaceContract) external onlyOwner {
        marketplaceContract = _marketplaceContract;
        emit MarketplaceContractUpdated(_marketplaceContract);
    }

    /**
     * @dev Update minting fee (only owner)
     */
    function setMintingFee(uint256 _mintingFee) external onlyOwner {
        mintingFee = _mintingFee;
        emit MintingFeeUpdated(_mintingFee);
    }

    /**
     * @dev Update maximum supply (only owner)
     */
    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply >= _tokenIdCounter.current(), "Cannot set max supply below current supply");
        maxSupply = _maxSupply;
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
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get current token ID counter
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Get total supply of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    /**
     * @dev Check if contract supports interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override tokenURI to use ERC721URIStorage
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override _burn to handle ERC721URIStorage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        delete _tokenRoyalties[tokenId];
    }

    /**
     * @dev Override _beforeTokenTransfer to handle pausable
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
