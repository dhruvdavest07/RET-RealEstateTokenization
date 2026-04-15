// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PropertyNFT.sol";
import "./PropertyShares.sol";

/**
 * @title TokenIT
 * @dev Main contract coordinating property registration, fractionalization,
 * share trading, rent deposits, dividend distribution, KYC whitelist,
 * property valuation updates, and dividend reinvestment (DRIP).
 */
contract TokenIT {

    PropertyNFT public propertyNFT;

    struct Property {
        uint256 propertyId;
        uint256 nftTokenId;
        address shareToken;
        uint256 totalShares;
        uint256 rentPool;
        uint256 shareSaleProceeds;
        bool fractionalized;
        uint256 sharePrice;
        uint256 minPurchaseAmount;
        uint256 maxPurchaseAmount;
        // Phase 3: Property Sale/Exit
        bool sold;
        uint256 saleProceeds;
    }

    mapping(uint256 => Property) public properties;
    mapping(uint256 => mapping(address => uint256)) public claimedDividends;
    uint256 public propertyCounter;
    address public owner;

    // ── Phase 2: KYC Whitelist ──────────────────────────────────────────────
    mapping(address => bool) public whitelisted;
    bool public whitelistEnabled;

    // ── Events ──────────────────────────────────────────────────────────────
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
        address indexed depositor,
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
    event ShareSaleProceedsWithdrawn(
        uint256 indexed propertyId,
        address indexed admin,
        uint256 amount
    );

    // Phase 3 events
    event PropertySold(
        uint256 indexed propertyId,
        uint256 salePrice,
        uint256 pricePerShare
    );
    event SaleProceedsClaimed(
        uint256 indexed propertyId,
        address indexed investor,
        uint256 amount,
        uint256 sharesRedeemed
    );

    // Phase 2 events
    event PropertyValueUpdated(
        uint256 indexed propertyId,
        uint256 oldSharePrice,
        uint256 newSharePrice
    );
    event InvestorWhitelisted(address indexed investor);
    event InvestorRemovedFromWhitelist(address indexed investor);
    event WhitelistToggled(bool enabled);
    event DividendsReinvested(
        uint256 indexed propertyId,
        address indexed investor,
        uint256 dividendAmount,
        uint256 sharesReceived
    );

    // ── Modifiers ────────────────────────────────────────────────────────────
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

    modifier onlyWhitelisted() {
        if (whitelistEnabled) {
            require(whitelisted[msg.sender], "Investor not whitelisted. Contact admin.");
        }
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(address _propertyNFT) {
        require(_propertyNFT != address(0), "Invalid PropertyNFT address");
        propertyNFT = PropertyNFT(_propertyNFT);
        owner = msg.sender;
        propertyCounter = 0;
    }

    // ── Property Registration ────────────────────────────────────────────────

    function registerAndFractionalizeProperty(
        string memory location,
        uint256 value,
        uint256 totalShares
    ) external onlyOwner returns (uint256) {
        return _registerAndFractionalizeProperty(location, value, totalShares, 1, 0);
    }

    function registerAndFractionalizeProperty(
        string memory location,
        uint256 value,
        uint256 totalShares,
        uint256 minPurchase,
        uint256 maxPurchase
    ) external onlyOwner returns (uint256) {
        return _registerAndFractionalizeProperty(location, value, totalShares, minPurchase, maxPurchase);
    }

    function _registerAndFractionalizeProperty(
        string memory location,
        uint256 value,
        uint256 totalShares,
        uint256 minPurchase,
        uint256 maxPurchase
    ) internal returns (uint256) {
        require(totalShares > 0, "Total shares must be greater than zero");
        require(value > 0, "Value must be greater than zero");
        require(minPurchase <= maxPurchase || maxPurchase == 0, "Invalid purchase limits");

        propertyCounter++;
        uint256 propertyId = propertyCounter;

        uint256 sharePrice = value / totalShares;
        require(sharePrice > 0, "Share price must be greater than zero");

        string memory tokenName = string.concat("Property ", _uintToString(propertyId), " Shares");
        string memory tokenSymbol = string.concat("P", _uintToString(propertyId), "S");

        PropertyShares shareToken = new PropertyShares(
            tokenName,
            tokenSymbol,
            totalShares,
            address(this),
            propertyId
        );

        properties[propertyId] = Property({
            propertyId: propertyId,
            nftTokenId: 0,
            shareToken: address(shareToken),
            totalShares: totalShares,
            rentPool: 0,
            shareSaleProceeds: 0,
            fractionalized: true,
            sharePrice: sharePrice,
            minPurchaseAmount: minPurchase,
            maxPurchaseAmount: maxPurchase,
            sold: false,
            saleProceeds: 0
        });

        emit PropertyFractionalized(propertyId, address(shareToken), totalShares, sharePrice);
        return propertyId;
    }

    function linkPropertyNFT(
        uint256 propertyId,
        uint256 nftTokenId
    ) external onlyOwner propertyExists(propertyId) {
        properties[propertyId].nftTokenId = nftTokenId;
    }

    // ── Share Trading ────────────────────────────────────────────────────────

    function buyShares(
        uint256 propertyId,
        uint256 amount
    ) external payable propertyExists(propertyId) isFractionalized(propertyId) onlyWhitelisted {
        require(!properties[propertyId].sold, "Property has been sold");
        require(amount > 0, "Amount must be greater than zero");

        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);

        if (property.minPurchaseAmount > 0) {
            require(amount >= property.minPurchaseAmount, "Below minimum purchase amount");
        }
        if (property.maxPurchaseAmount > 0) {
            require(amount <= property.maxPurchaseAmount, "Exceeds maximum purchase amount");
        }

        uint256 cost = property.sharePrice * amount;
        require(msg.value >= cost, "Insufficient payment");

        uint256 availableShares = shareToken.balanceOf(address(this));
        require(availableShares >= amount, "Not enough shares available");

        uint256 maxAllowedInOnePurchase = (availableShares * 50) / 100;
        if (maxAllowedInOnePurchase > 0) {
            require(amount <= maxAllowedInOnePurchase, "Cannot buy more than 50% of available shares at once");
        }

        bool success = shareToken.transfer(msg.sender, amount);
        require(success, "Share transfer failed");

        property.shareSaleProceeds += cost;

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit SharesPurchased(propertyId, msg.sender, amount, cost);
    }

    // ── Rent & Dividends ─────────────────────────────────────────────────────

    function depositRent(
        uint256 propertyId
    ) external payable propertyExists(propertyId) isFractionalized(propertyId) {
        require(msg.value > 0, "Rent amount must be greater than zero");
        Property storage property = properties[propertyId];
        property.rentPool += msg.value;
        emit RentDeposited(propertyId, msg.sender, msg.value, property.rentPool);
    }

    function claimDividends(
        uint256 propertyId
    ) external propertyExists(propertyId) {
        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);

        uint256 shares = shareToken.balanceOf(msg.sender);
        require(shares > 0, "No shares owned");

        uint256 totalEntitlement = (shares * property.rentPool) / property.totalShares;
        uint256 alreadyClaimed = claimedDividends[propertyId][msg.sender];

        require(totalEntitlement > alreadyClaimed, "No dividends to claim");
        uint256 claimable = totalEntitlement - alreadyClaimed;

        // Checks-Effects-Interactions
        claimedDividends[propertyId][msg.sender] = totalEntitlement;
        payable(msg.sender).transfer(claimable);

        emit DividendsClaimed(propertyId, msg.sender, claimable);
    }

    // ── Phase 2: Dividend Reinvestment (DRIP) ────────────────────────────────

    /**
     * @dev Instead of withdrawing dividends as ETH, invest them directly
     * into more shares of the same property.
     * The ETH stays in the contract (credited to shareSaleProceeds for admin).
     */
    function reinvestDividends(
        uint256 propertyId
    ) external propertyExists(propertyId) isFractionalized(propertyId) {
        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);

        uint256 shares = shareToken.balanceOf(msg.sender);
        require(shares > 0, "No shares owned");

        uint256 totalEntitlement = (shares * property.rentPool) / property.totalShares;
        uint256 alreadyClaimed = claimedDividends[propertyId][msg.sender];
        require(totalEntitlement > alreadyClaimed, "No dividends to reinvest");

        uint256 claimable = totalEntitlement - alreadyClaimed;
        uint256 sharesToReceive = claimable / property.sharePrice;
        require(sharesToReceive > 0, "Dividend too small to buy even one share");

        uint256 availableShares = shareToken.balanceOf(address(this));
        require(availableShares >= sharesToReceive, "Not enough shares available for reinvestment");

        uint256 costOfShares = sharesToReceive * property.sharePrice;

        // Mark dividends as claimed; ETH stays in contract as proceeds
        claimedDividends[propertyId][msg.sender] = totalEntitlement;
        property.shareSaleProceeds += costOfShares;

        bool success = shareToken.transfer(msg.sender, sharesToReceive);
        require(success, "Share transfer failed");

        emit DividendsReinvested(propertyId, msg.sender, claimable, sharesToReceive);
    }

    // ── Phase 2: Property Valuation Update ──────────────────────────────────

    /**
     * @dev Update the market value of a property, recalculating share price.
     * Does not affect existing balances or claimed dividends.
     */
    function updatePropertyValue(
        uint256 propertyId,
        uint256 newValue
    ) external onlyOwner propertyExists(propertyId) {
        require(newValue > 0, "Value must be greater than zero");
        Property storage property = properties[propertyId];
        uint256 newSharePrice = newValue / property.totalShares;
        require(newSharePrice > 0, "New share price rounds to zero");

        uint256 oldSharePrice = property.sharePrice;
        property.sharePrice = newSharePrice;

        emit PropertyValueUpdated(propertyId, oldSharePrice, newSharePrice);
    }

    // ── Phase 2: KYC Whitelist Management ───────────────────────────────────

    function setWhitelistEnabled(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
        emit WhitelistToggled(enabled);
    }

    function addToWhitelist(address investor) external onlyOwner {
        require(investor != address(0), "Invalid address");
        whitelisted[investor] = true;
        emit InvestorWhitelisted(investor);
    }

    function removeFromWhitelist(address investor) external onlyOwner {
        whitelisted[investor] = false;
        emit InvestorRemovedFromWhitelist(investor);
    }

    function addBatchToWhitelist(address[] calldata investors) external onlyOwner {
        for (uint256 i = 0; i < investors.length; i++) {
            require(investors[i] != address(0), "Invalid address in batch");
            whitelisted[investors[i]] = true;
            emit InvestorWhitelisted(investors[i]);
        }
    }

    // ── Admin: Proceeds & Limits ─────────────────────────────────────────────

    function withdrawShareSaleProceeds(
        uint256 propertyId,
        uint256 amount
    ) external onlyOwner propertyExists(propertyId) {
        Property storage property = properties[propertyId];
        uint256 withdrawAmount = amount == 0 ? property.shareSaleProceeds : amount;
        require(withdrawAmount > 0, "No proceeds to withdraw");
        require(withdrawAmount <= property.shareSaleProceeds, "Insufficient proceeds");

        property.shareSaleProceeds -= withdrawAmount;
        payable(owner).transfer(withdrawAmount);

        emit ShareSaleProceedsWithdrawn(propertyId, msg.sender, withdrawAmount);
    }

    function getShareSaleProceeds(uint256 propertyId) external view propertyExists(propertyId) returns (uint256) {
        return properties[propertyId].shareSaleProceeds;
    }

    function setPurchaseLimits(
        uint256 propertyId,
        uint256 minPurchase,
        uint256 maxPurchase
    ) external onlyOwner propertyExists(propertyId) {
        require(minPurchase <= maxPurchase || maxPurchase == 0, "Invalid purchase limits");
        properties[propertyId].minPurchaseAmount = minPurchase;
        properties[propertyId].maxPurchaseAmount = maxPurchase;
    }

    // ── Share Transfer ───────────────────────────────────────────────────────

    function transferShares(
        uint256 propertyId,
        address to,
        uint256 amount
    ) external propertyExists(propertyId) {
        require(to != address(0), "Cannot transfer to zero address");
        require(amount > 0, "Amount must be greater than zero");

        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);

        // Uses TokenIT-privileged helper — no ERC20 approval needed from investor
        shareToken.transferOnBehalf(msg.sender, to, amount);

        emit SharesTransferred(propertyId, msg.sender, to, amount);
    }

    // ── Phase 3: Property Sale / Exit ────────────────────────────────────────

    /**
     * @dev Admin marks a property as sold by depositing the total sale proceeds.
     * Buying new shares is blocked. Existing investors can redeem via claimSaleProceeds.
     */
    function initiatePropertySale(
        uint256 propertyId
    ) external payable onlyOwner propertyExists(propertyId) {
        Property storage property = properties[propertyId];
        require(!property.sold, "Property already sold");
        require(msg.value > 0, "Must send sale proceeds");

        property.sold = true;
        property.fractionalized = false; // Block new share purchases
        property.saleProceeds = msg.value;

        emit PropertySold(propertyId, msg.value, msg.value / property.totalShares);
    }

    /**
     * @dev Investor redeems their shares for a proportional payout of sale proceeds.
     * Shares are burned. No ERC20 approval required.
     */
    function claimSaleProceeds(
        uint256 propertyId
    ) external propertyExists(propertyId) {
        Property storage property = properties[propertyId];
        require(property.sold, "Property not sold yet");

        PropertyShares shareToken = PropertyShares(property.shareToken);
        uint256 shares = shareToken.balanceOf(msg.sender);
        require(shares > 0, "No shares to redeem");

        uint256 payout = (shares * property.saleProceeds) / property.totalShares;
        require(payout > 0, "Nothing to claim");

        // Checks-Effects-Interactions: burn shares before sending ETH
        shareToken.burnShares(msg.sender, shares);
        payable(msg.sender).transfer(payout);

        emit SaleProceedsClaimed(propertyId, msg.sender, payout, shares);
    }

    /**
     * @dev Helper used by Marketplace.sol to look up a property's share token
     * and sold status without importing the full Property struct.
     */
    function getPropertyShareToken(
        uint256 propertyId
    ) external view propertyExists(propertyId) returns (address shareToken, bool sold) {
        Property storage p = properties[propertyId];
        return (p.shareToken, p.sold);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    function getProperty(uint256 propertyId) external view returns (Property memory) {
        require(properties[propertyId].propertyId != 0, "Property does not exist");
        return properties[propertyId];
    }

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
     * @dev Preview how many shares a DRIP reinvestment would yield.
     */
    function previewReinvestment(
        uint256 propertyId,
        address investor
    ) external view propertyExists(propertyId) returns (uint256 dividendAmount, uint256 sharesWouldReceive) {
        Property storage property = properties[propertyId];
        PropertyShares shareToken = PropertyShares(property.shareToken);

        uint256 shares = shareToken.balanceOf(investor);
        if (shares == 0) return (0, 0);

        uint256 totalEntitlement = (shares * property.rentPool) / property.totalShares;
        uint256 alreadyClaimed = claimedDividends[propertyId][investor];
        if (totalEntitlement <= alreadyClaimed) return (0, 0);

        dividendAmount = totalEntitlement - alreadyClaimed;
        sharesWouldReceive = dividendAmount / property.sharePrice;
    }

    function getTotalProperties() external view returns (uint256) {
        return propertyCounter;
    }

    // ── Utilities ────────────────────────────────────────────────────────────

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    receive() external payable {}
}
