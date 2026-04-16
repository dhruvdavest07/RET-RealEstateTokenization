// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Marketplace
 * @dev Peer-to-peer secondary market for PropertyShares tokens.
 * Sellers list shares at a custom price; buyers fill listings atomically.
 * Requires sellers to approve this contract via ERC20.approve() before listing.
 */

interface ITokenIT {
    function getPropertyShareToken(uint256 propertyId)
        external view returns (address shareToken, bool sold);
}

contract Marketplace {

    struct Listing {
        uint256 listingId;
        uint256 propertyId;
        address seller;
        address shareToken;
        uint256 shares;
        uint256 pricePerShare; // in wei
        bool active;
    }

    ITokenIT public immutable tokenIT;
    uint256 public listingCounter;

    mapping(uint256 => Listing) public listings;
    /// @dev propertyId => listingIds ever created (including inactive)
    mapping(uint256 => uint256[]) public propertyListings;

    event ListingCreated(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address indexed seller,
        uint256 shares,
        uint256 pricePerShare
    );
    event ListingFilled(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address indexed buyer,
        address seller,
        uint256 shares,
        uint256 totalCost
    );
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );

    constructor(address _tokenIT) {
        require(_tokenIT != address(0), "Invalid TokenIT address");
        tokenIT = ITokenIT(_tokenIT);
    }

    // ── Create Listing ───────────────────────────────────────────────────────

    /**
     * @dev List shares for sale. Seller must have called shareToken.approve(marketplace, shares) first.
     */
    function createListing(
        uint256 propertyId,
        uint256 shares,
        uint256 pricePerShare
    ) external returns (uint256) {
        require(shares > 0, "Shares must be greater than zero");
        require(pricePerShare > 0, "Price must be greater than zero");

        (address shareTokenAddr, bool sold) = tokenIT.getPropertyShareToken(propertyId);
        require(!sold, "Property has been sold - cannot list shares");

        IERC20 shareToken = IERC20(shareTokenAddr);
        require(shareToken.balanceOf(msg.sender) >= shares, "Insufficient share balance");
        require(
            shareToken.allowance(msg.sender, address(this)) >= shares,
            "Approve Marketplace to transfer your shares first"
        );

        listingCounter++;
        listings[listingCounter] = Listing({
            listingId: listingCounter,
            propertyId: propertyId,
            seller: msg.sender,
            shareToken: shareTokenAddr,
            shares: shares,
            pricePerShare: pricePerShare,
            active: true
        });
        propertyListings[propertyId].push(listingCounter);

        emit ListingCreated(listingCounter, propertyId, msg.sender, shares, pricePerShare);
        return listingCounter;
    }

    // ── Buy Listing ──────────────────────────────────────────────────────────

    /**
     * @dev Purchase an active listing. Send exact ETH (excess is refunded).
     */
    function buyListing(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.seller != msg.sender, "Cannot buy your own listing");

        uint256 totalCost = listing.shares * listing.pricePerShare;
        require(msg.value >= totalCost, "Insufficient payment");

        // Checks-Effects-Interactions: deactivate before external calls
        listing.active = false;

        address seller = listing.seller;
        uint256 shares = listing.shares;
        uint256 propertyId = listing.propertyId;

        IERC20 shareToken = IERC20(listing.shareToken);
        require(
            shareToken.transferFrom(seller, msg.sender, shares),
            "Share transfer failed - seller may have revoked approval"
        );

        payable(seller).transfer(totalCost);

        // Refund any overpayment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit ListingFilled(listingId, propertyId, msg.sender, seller, shares, totalCost);
    }

    // ── Cancel Listing ───────────────────────────────────────────────────────

    /**
     * @dev Seller cancels an active listing. No penalty.
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not your listing");
        require(listing.active, "Listing already inactive");

        listing.active = false;
        emit ListingCancelled(listingId, msg.sender);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    /**
     * @dev Returns all currently active listings for a specific property.
     */
    function getActiveListings(uint256 propertyId)
        external view returns (Listing[] memory)
    {
        uint256[] storage ids = propertyListings[propertyId];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (listings[ids[i]].active) count++;
        }
        Listing[] memory result = new Listing[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (listings[ids[i]].active) result[j++] = listings[ids[i]];
        }
        return result;
    }

    /**
     * @dev Returns all currently active listings across all properties.
     */
    function getAllActiveListings() external view returns (Listing[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= listingCounter; i++) {
            if (listings[i].active) count++;
        }
        Listing[] memory result = new Listing[](count);
        uint256 j = 0;
        for (uint256 i = 1; i <= listingCounter; i++) {
            if (listings[i].active) result[j++] = listings[i];
        }
        return result;
    }
}
