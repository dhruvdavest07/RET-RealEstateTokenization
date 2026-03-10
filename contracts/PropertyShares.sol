// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title PropertyShares
 * @dev ERC20 token representing fractional ownership of a single property
 * This contract is deployed dynamically by the TokenIT main contract
 */
contract PropertyShares is ERC20 {
    
    // The address that deployed this token (TokenIT contract)
    address public immutable tokenIT;
    
    // The property ID this token represents
    uint256 public immutable propertyId;
    
    // Total number of shares minted
    uint256 public immutable totalShares;
    
    /**
     * @dev Event emitted when shares are transferred between investors
     */
    event SharesTransferred(
        uint256 indexed propertyId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    /**
     * @dev Constructor mints all shares to the owner on deployment
     * @param name Token name (e.g., "Property 1 Shares")
     * @param symbol Token symbol (e.g., "P1S")
     * @param shares Total number of shares to mint
     * @param owner Address to receive all shares (TokenIT contract)
     * @param _propertyId The property ID this token represents
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 shares,
        address owner,
        uint256 _propertyId
    ) ERC20(name, symbol) {
        require(shares > 0, "Shares must be greater than zero");
        require(owner != address(0), "Owner cannot be zero address");
        
        tokenIT = msg.sender;
        propertyId = _propertyId;
        totalShares = shares;
        
        // Mint all shares to the owner
        _mint(owner, shares);
    }
    
    /**
     * @dev Override transfer to emit custom event for demo visibility
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        bool success = super.transfer(to, amount);
        if (success) {
            emit SharesTransferred(propertyId, msg.sender, to, amount);
        }
        return success;
    }
    
    /**
     * @dev Override transferFrom to emit custom event for demo visibility
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        bool success = super.transferFrom(from, to, amount);
        if (success) {
            emit SharesTransferred(propertyId, from, to, amount);
        }
        return success;
    }
    
    /**
     * @dev Get the percentage ownership of an account
     * @param account Address to check
     * @return Percentage with 2 decimal places (e.g., 2500 = 25.00%)
     */
    function getOwnershipPercentage(address account) external view returns (uint256) {
        uint256 balance = balanceOf(account);
        if (balance == 0) return 0;
        if (totalShares == 0) return 0;
        
        // Return percentage with 2 decimal places (multiply by 10000)
        return (balance * 10000) / totalShares;
    }
    
    /**
     * @dev Get remaining shares available for purchase
     * @return uint256 Amount of shares still held by TokenIT
     */
    function getAvailableShares() external view returns (uint256) {
        return balanceOf(tokenIT);
    }
}
