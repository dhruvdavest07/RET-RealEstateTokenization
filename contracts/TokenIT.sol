// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PropertyNFT.sol";
import "./PropertyShares.sol";

/**
 * @title TokenIT
 * @dev Main contract coordinating property registration, fractionalization,
 * share trading, rent deposits, and dividend distribution
 */
contract TokenIT {
    
    // Reference to the PropertyNFT contract
    PropertyNFT public propertyNFT;
    
    /**
     * @dev Struct storing all data about a fractionalized property
     */
    struct Property {
        uint256 propertyId;
        uint256 nftTokenId;
        address shareToken;
        uint256 totalShares;
        uint256 rentPool;
        bool fractionalized;
        uint256 sharePrice; // Price per share in wei
    }
    
    // Mapping from propertyId to Property struct
    mapping(uint256 => Property) public properties;
    
    // Mapping to track claimed dividends per user per property
    // propertyId => user => amount claimed
    mapping(uint256 => mapping(address => uint256)) public claimedDividends;
    
    // Counter for properties
    uint256 public propertyCounter;
    
    // Contract owner (admin)
    address public owner;
    
    // Events
    event PropertyFractionalized(
        uint256 indexed propertyId,
        address indexed shareToken,
        uint256 totalShares,
        uint256 sharePrice
    );
    
    event SharesPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 amount,
        uint256 cost
    );
    
    event RentDeposited(
        uint256 indexed propertyId,
        uint256 amount,
        uint256 newRentPool
    );
    
    event DividendsClaimed(
        uint256 indexed propertyId,
        address indexed investor,
        uint256 amount
    );
    
    event SharesTransferred(
        uint256 indexed propertyId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier propertyExists(uint256 propertyId) {
        require(properties[propertyId].propertyId != 0, "Property does not exist");
        _;
    }
    
    modifier isFractionalized(uint256 propertyId) {
        require(properties[propertyId].fractionalized, "Property not fractionalized");
        _;
    }
    
    /**
     * @dev Constructor sets the PropertyNFT contract address
     * @param _propertyNFT Address of the deployed PropertyNFT contract
     */
    constructor(address _propertyNFT) {
        require(_propertyNFT != address(0), "Invalid PropertyNFT address");
        propertyNFT = PropertyNFT(_propertyNFT);
        owner = msg.sender;
        propertyCounter = 0;
    }
    
    /**
     * @dev Register a new property and fractionalize it in one transaction
     * @param location Physical location of the property
     * @param value Total value of the property in wei
     * @param totalShares Number of shares to create
     * @return propertyId The ID of the newly created property
     */
    function registerAndFractionalizeProperty(
        string memory location,
        uint256 value,
        uint256 totalShares
    ) external onlyOwner returns (uint256) {
        require(totalShares > 0, "Total shares must be greater than zero");
        require(value > 0, "Value must be greater than zero");
        
        // Step 1: Register property in NFT contract
        // Note: This requires TokenIT to be the owner of PropertyNFT
        // For demo purposes, we assume proper ownership setup
        
        // Call PropertyNFT to register (this would need proper authorization)
        // For now, we use a simplified approach where the admin calls both
        
        propertyCounter++;
        uint256 propertyId = propertyCounter;
        
        // Note: In a real scenario, we'd call propertyNFT.registerProperty
        // For this demo, we assume property NFT is registered separately
        // and we just link to it here
        
        // Calculate share price
        uint256 sharePrice = value / totalShares;
        
        // Step 2: Deploy new PropertyShares token
        string memory tokenName = string.concat("Property ", _uintToString(propertyId), " Shares");
        string memory tokenSymbol = string.concat("P", _uintToString(propertyId), "S");
        
        PropertyShares shareToken = new PropertyShares(
            tokenName,
            tokenSymbol,
            totalShares,
            address(this), // TokenIT holds all shares initially
            propertyId
        );
        
        // Step 3: Store property data
        properties[propertyId] = Property({
            propertyId: propertyId,
            nftTokenId: 0, // Will be set separately when NFT is minted
            shareToken: address(shareToken),
            totalShares: totalShares,
            rentPool: 0,
            fractionalized: true,
            sharePrice: sharePrice
        });
        
        emit PropertyFractionalized(
            propertyId,
            address(shareToken),
            totalShares,
            sharePrice
        );
        
        return propertyId;
    }
    
    /**
     * @dev Link a property to its NFT after separate registration
     * @param propertyId The property ID to link
     * @param nftTokenId The NFT token ID from PropertyNFT
     */
    function linkPropertyNFT(
        uint256 propertyId,
        uint256 nftTokenId
    ) external onlyOwner propertyExists(propertyId) {
        properties[propertyId].nftTokenId = nftTokenId;
    }
    
    /**
     * @dev Buy shares of a property
     * @param propertyId The property to buy shares of
     * @param amount Number of shares to buy
     */
    function buyShares(
        uint256 propertyId,
        uint256 amount
    ) external payable propertyExists(propertyId) isFractionalized(propertyId) {
        require(amount > 0, "Amount must be greater than zero");
        
        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);
        
        // Calculate cost
        uint256 cost = property.sharePrice * amount;
        require(msg.value >= cost, "Insufficient payment");
        
        // Check available shares
        uint256 availableShares = shareToken.balanceOf(address(this));
        require(availableShares >= amount, "Not enough shares available");
        
        // Transfer shares from TokenIT to buyer
        bool success = shareToken.transfer(msg.sender, amount);
        require(success, "Share transfer failed");
        
        // Refund excess payment
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
        
        emit SharesPurchased(propertyId, msg.sender, amount, cost);
    }
    
    /**
     * @dev Deposit rent for a property (payable)
     * @param propertyId The property to deposit rent for
     */
    function depositRent(
        uint256 propertyId
    ) external payable propertyExists(propertyId) isFractionalized(propertyId) {
        require(msg.value > 0, "Rent amount must be greater than zero");
        
        Property storage property = properties[propertyId];
        property.rentPool += msg.value;
        
        emit RentDeposited(propertyId, msg.value, property.rentPool);
    }
    
    /**
     * @dev Claim dividends for a property
     * @param propertyId The property to claim dividends from
     */
    function claimDividends(
        uint256 propertyId
    ) external propertyExists(propertyId) isFractionalized(propertyId) {
        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);
        
        uint256 shares = shareToken.balanceOf(msg.sender);
        require(shares > 0, "No shares owned");
        
        // Calculate total dividend entitlement
        // (shares / totalShares) * rentPool
        uint256 totalEntitlement = (shares * property.rentPool) / property.totalShares;
        
        // Calculate already claimed
        uint256 alreadyClaimed = claimedDividends[propertyId][msg.sender];
        
        // Calculate claimable amount
        require(totalEntitlement > alreadyClaimed, "No dividends to claim");
        uint256 claimable = totalEntitlement - alreadyClaimed;
        
        // Update claimed amount
        claimedDividends[propertyId][msg.sender] = totalEntitlement;
        
        // Transfer dividends
        payable(msg.sender).transfer(claimable);
        
        emit DividendsClaimed(propertyId, msg.sender, claimable);
    }
    
    /**
     * @dev Get property details
     * @param propertyId The property to query
     * @return Property struct
     */
    function getProperty(uint256 propertyId) external view returns (Property memory) {
        require(properties[propertyId].propertyId != 0, "Property does not exist");
        return properties[propertyId];
    }
    
    /**
     * @dev Get pending dividends for an investor
     * @param propertyId The property to check
     * @param investor The investor address
     * @return uint256 Amount of dividends available to claim
     */
    function getPendingDividends(
        uint256 propertyId,
        address investor
    ) external view propertyExists(propertyId) isFractionalized(propertyId) returns (uint256) {
        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);
        
        uint256 shares = shareToken.balanceOf(investor);
        if (shares == 0) return 0;
        
        uint256 totalEntitlement = (shares * property.rentPool) / property.totalShares;
        uint256 alreadyClaimed = claimedDividends[propertyId][investor];
        
        if (totalEntitlement <= alreadyClaimed) return 0;
        return totalEntitlement - alreadyClaimed;
    }
    
    /**
     * @dev Get investor info for a property
     * @param propertyId The property to check
     * @param investor The investor address
     * @return sharesOwned Number of shares owned
     * @return ownershipPercentage Percentage with 2 decimals (e.g., 2500 = 25%)
     * @return pendingDividends Amount available to claim
     */
    function getInvestorInfo(
        uint256 propertyId,
        address investor
    ) external view propertyExists(propertyId) returns (
        uint256 sharesOwned,
        uint256 ownershipPercentage,
        uint256 pendingDividends
    ) {
        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);
        
        sharesOwned = shareToken.balanceOf(investor);
        
        if (sharesOwned > 0 && property.totalShares > 0) {
            ownershipPercentage = (sharesOwned * 10000) / property.totalShares;
        }
        
        if (sharesOwned > 0) {
            uint256 totalEntitlement = (sharesOwned * property.rentPool) / property.totalShares;
            uint256 alreadyClaimed = claimedDividends[propertyId][investor];
            if (totalEntitlement > alreadyClaimed) {
                pendingDividends = totalEntitlement - alreadyClaimed;
            }
        }
    }
    
    /**
     * @dev Transfer shares to another address (wrapper for convenience)
     * @param propertyId The property shares to transfer
     * @param to Recipient address
     * @param amount Number of shares
     */
    function transferShares(
        uint256 propertyId,
        address to,
        uint256 amount
    ) external propertyExists(propertyId) isFractionalized(propertyId) {
        require(to != address(0), "Cannot transfer to zero address");
        require(amount > 0, "Amount must be greater than zero");
        
        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);
        
        bool success = shareToken.transferFrom(msg.sender, to, amount);
        require(success, "Transfer failed");
        
        emit SharesTransferred(propertyId, msg.sender, to, amount);
    }
    
    /**
     * @dev Get total number of properties
     * @return uint256 Total count
     */
    function getTotalProperties() external view returns (uint256) {
        return propertyCounter;
    }
    
    /**
     * @dev Utility function to convert uint to string
     */
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {}
}
