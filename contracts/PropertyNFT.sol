// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyNFT
 * @dev ERC721 contract for registering real estate properties as NFTs
 * Each property is represented by a unique NFT with metadata
 */
contract PropertyNFT is ERC721, Ownable {
    
    // Counter for generating unique property IDs
    uint256 private _propertyIdCounter;
    
    // Counter for generating unique NFT token IDs
    uint256 private _tokenIdCounter;
    
    /**
     * @dev Struct to store property metadata
     */
    struct PropertyData {
        uint256 propertyId;
        string location;
        uint256 value;
        uint256 tokenId;
        bool exists;
    }
    
    // Mapping from propertyId to PropertyData
    mapping(uint256 => PropertyData) public properties;
    
    // Mapping from tokenId to propertyId (for reverse lookup)
    mapping(uint256 => uint256) public tokenToProperty;
    
    /**
     * @dev Event emitted when a new property is registered
     */
    event PropertyRegistered(
        uint256 indexed propertyId,
        uint256 indexed tokenId,
        string location,
        uint256 value
    );
    
    /**
     * @dev Constructor initializes the NFT collection
     */
    constructor() ERC721("TokenIT Property", "TIP") Ownable(msg.sender) {
        _propertyIdCounter = 0;
        _tokenIdCounter = 0;
    }
    
    /**
     * @dev Register a new property as an NFT
     * @param location The physical location of the property
     * @param value The total value of the property in wei
     * @return propertyId The unique ID assigned to this property
     */
    function registerProperty(
        string memory location,
        uint256 value
    ) external onlyOwner returns (uint256) {
        require(bytes(location).length > 0, "Location cannot be empty");
        require(value > 0, "Value must be greater than zero");
        
        // Increment counters
        _propertyIdCounter++;
        _tokenIdCounter++;
        
        uint256 propertyId = _propertyIdCounter;
        uint256 tokenId = _tokenIdCounter;
        
        // Store property data
        properties[propertyId] = PropertyData({
            propertyId: propertyId,
            location: location,
            value: value,
            tokenId: tokenId,
            exists: true
        });
        
        // Map token to property
        tokenToProperty[tokenId] = propertyId;
        
        // Mint NFT to the contract owner
        _safeMint(msg.sender, tokenId);
        
        emit PropertyRegistered(propertyId, tokenId, location, value);
        
        return propertyId;
    }
    
    /**
     * @dev Get property details by propertyId
     * @param propertyId The ID of the property to query
     * @return PropertyData struct containing all property information
     */
    function getProperty(uint256 propertyId) external view returns (PropertyData memory) {
        require(properties[propertyId].exists, "Property does not exist");
        return properties[propertyId];
    }
    
    /**
     * @dev Get property details by NFT tokenId
     * @param tokenId The NFT token ID
     * @return PropertyData struct containing all property information
     */
    function getPropertyByTokenId(uint256 tokenId) external view returns (PropertyData memory) {
        uint256 propertyId = tokenToProperty[tokenId];
        require(propertyId != 0, "Token does not represent any property");
        return properties[propertyId];
    }
    
    /**
     * @dev Check if a property exists
     * @param propertyId The ID to check
     * @return bool indicating if property exists
     */
    function propertyExists(uint256 propertyId) external view returns (bool) {
        return properties[propertyId].exists;
    }
    
    /**
     * @dev Get total number of registered properties
     * @return uint256 Total count
     */
    function getTotalProperties() external view returns (uint256) {
        return _propertyIdCounter;
    }
}
