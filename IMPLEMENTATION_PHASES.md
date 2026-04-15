# TokenIT — Feature Implementation Phases

Features to implement: Secondary Market (#1), Property Valuation Updates (#2), Property Sale/Exit (#5), Dividend Reinvestment (#8), KYC/Whitelist (#9), Portfolio Dashboard (#12), Property Detail Page (#13)

Phases are ordered by risk and dependency — frontend-only work first, contract extensions second, new contracts last.

---

## Phase 1 — Frontend Only (Zero Contract Risk)

**Features: Portfolio Dashboard (#12), Property Detail Page (#13)**

No smart contract changes. Pure React work. Safe to do first — if something breaks, just fix the component.

---

### Feature 12: Portfolio Dashboard

**What it is**: A "My Investments" view showing all properties an investor holds shares in, total portfolio value, total dividends claimed, and pending dividends across all properties.

**How to implement**:

The contract already has `getTotalProperties()` and `getInvestorInfo(propertyId, investor)`. The frontend can loop through all property IDs, call `getInvestorInfo` for each, and aggregate.

**New component**: `frontend/src/components/PortfolioDashboard.jsx`

Logic:
```js
// For each propertyId from 1 to totalProperties:
const info = await contract.getInvestorInfo(propertyId, account);
if (info.sharesOwned > 0) {
  // include in portfolio
}
```

Display:
- Table of properties where investor has shares: ID, shares owned, ownership %, pending dividends
- Summary row: total ETH invested (shares × sharePrice), total pending dividends
- "Claim All" button — loops and calls `claimDividends` for each property with pending amount > 0

**Route/tab**: Add a "Portfolio" tab in the header next to the main property view.

---

### Feature 13: Property Detail Page

**What it is**: A dedicated full-screen view for a single property with richer info — financial history from events, ownership distribution, property metadata.

**How to implement**:

Events are already emitted. Ethers.js can query past events with `contract.queryFilter(filter, fromBlock, toBlock)`.

**New component**: `frontend/src/components/PropertyDetail.jsx`

Sections to build:

1. **Rent History**: Query `RentDeposited` events for this propertyId → show a timeline of deposits with amounts and dates
2. **Dividend Payouts**: Query `DividendsClaimed` events → total paid out, list of claimants
3. **Ownership Distribution**: Query `SharesPurchased` events or read balances of known buyers → simple pie chart (use `recharts` or `chart.js`)
4. **Share Token Info**: Display the ERC20 token address, symbol (e.g. "P1S"), available shares, sold shares
5. **Documents section** (placeholder): "No documents uploaded" with future IPFS integration note

**Trigger**: Clicking property ID number anywhere in the UI opens the detail page/modal.

---

## Phase 2 — Smart Contract Extensions

**Features: Property Valuation Updates (#2), KYC/Whitelist (#9), Dividend Reinvestment (#8)**

These add new functions to `TokenIT.sol` without changing any existing storage layout or function signatures. Existing deployments would need to be redeployed (contracts are not upgradeable).

---

### Feature 2: Property Valuation Updates

**What it is**: Admin can update the property's market value, which recalculates the share price. Important for showing appreciation/depreciation over time.

**Contract changes** — add to `TokenIT.sol`:

```solidity
event PropertyValueUpdated(
    uint256 indexed propertyId,
    uint256 oldValue,
    uint256 newValue,
    uint256 newSharePrice
);

function updatePropertyValue(
    uint256 propertyId,
    uint256 newValue
) external onlyOwner propertyExists(propertyId) {
    require(newValue > 0, "Value must be greater than zero");
    Property storage property = properties[propertyId];
    
    uint256 oldSharePrice = property.sharePrice;
    uint256 newSharePrice = newValue / property.totalShares;
    require(newSharePrice > 0, "Share price rounds to zero");
    
    property.sharePrice = newSharePrice;
    
    emit PropertyValueUpdated(propertyId, oldSharePrice * property.totalShares, newValue, newSharePrice);
}
```

**Important caveat**: Changing share price affects how much new buyers pay. It does NOT retroactively change what existing holders paid — their investment value is just the current market price × their shares. This must be explained clearly in the UI.

**Frontend changes**: Add "Update Property Value" input in AdminPanel (shown only when property is loaded).

---

### Feature 9: KYC / Investor Whitelist

**What it is**: Only admin-approved wallet addresses can buy shares. Regulatory compliance measure.

**Contract changes** — add to `TokenIT.sol`:

```solidity
mapping(address => bool) public whitelisted;
bool public whitelistEnabled;

event InvestorWhitelisted(address indexed investor);
event InvestorRemovedFromWhitelist(address indexed investor);
event WhitelistToggled(bool enabled);

modifier onlyWhitelisted() {
    if (whitelistEnabled) {
        require(whitelisted[msg.sender], "Investor not whitelisted");
    }
    _;
}

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
        whitelisted[investors[i]] = true;
        emit InvestorWhitelisted(investors[i]);
    }
}
```

Apply the modifier to `buyShares`:
```solidity
function buyShares(...) external payable propertyExists(propertyId) isFractionalized(propertyId) onlyWhitelisted {
```

**Frontend changes**:
- AdminPanel: "Whitelist Management" section — toggle enable/disable, add/remove addresses
- InvestorActions: show "You are not whitelisted" message if `whitelisted[account]` returns false

**Note**: `whitelistEnabled` defaults to `false` — existing behavior unchanged until admin turns it on.

---

### Feature 8: Dividend Reinvestment (DRIP)

**What it is**: Instead of withdrawing dividends as ETH, an investor can reinvest them directly into more shares of the same property. Classic REIT feature.

**Contract changes** — add to `TokenIT.sol`:

```solidity
event DividendsReinvested(
    uint256 indexed propertyId,
    address indexed investor,
    uint256 dividendAmount,
    uint256 sharesReceived
);

function reinvestDividends(uint256 propertyId)
    external
    propertyExists(propertyId)
    isFractionalized(propertyId)
{
    Property storage property = properties[propertyId];
    PropertyShares shareToken = PropertyShares(property.shareToken);

    uint256 shares = shareToken.balanceOf(msg.sender);
    require(shares > 0, "No shares owned");

    // Calculate claimable dividends
    uint256 totalEntitlement = (shares * property.rentPool) / property.totalShares;
    uint256 alreadyClaimed = claimedDividends[propertyId][msg.sender];
    require(totalEntitlement > alreadyClaimed, "No dividends to reinvest");
    uint256 claimable = totalEntitlement - alreadyClaimed;

    // Calculate how many shares the dividend amount can buy
    uint256 sharesToReceive = claimable / property.sharePrice;
    require(sharesToReceive > 0, "Dividend too small to buy even one share");

    // Check available shares
    uint256 availableShares = shareToken.balanceOf(address(this));
    require(availableShares >= sharesToReceive, "Not enough shares available for reinvestment");

    // Mark dividends as claimed (the ETH stays in the contract as shareSaleProceeds)
    claimedDividends[propertyId][msg.sender] = totalEntitlement;

    // ETH stays in contract, credited to shareSaleProceeds
    uint256 costOfShares = sharesToReceive * property.sharePrice;
    property.shareSaleProceeds += costOfShares;

    // Transfer shares
    bool success = shareToken.transfer(msg.sender, sharesToReceive);
    require(success, "Share transfer failed");

    emit DividendsReinvested(propertyId, msg.sender, claimable, sharesToReceive);
}
```

**Frontend changes**: Add "Reinvest Dividends" button next to "Claim Dividends" in InvestorActions. Show projected shares to receive: `Math.floor(pendingDividends / sharePrice)`.

---

## Phase 3 — New Contracts

**Features: Property Sale/Exit (#5), Secondary Market (#1)**

These require entirely new contracts or significant new logic. Most complex phase — highest potential for bugs. Implement after Phase 1 and 2 are stable.

---

### Feature 5: Property Sale / Exit Mechanism

**What it is**: Admin marks a property as sold at a sale price. All shareholders can claim their proportional share of the sale proceeds. Shares are effectively redeemed.

**Contract changes** — add to `TokenIT.sol`:

New fields in `Property` struct:
```solidity
bool sold;
uint256 saleProceeds; // Total ETH from property sale
```

New functions:
```solidity
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

// Admin calls this when the physical property is sold
function initiatePropertySale(uint256 propertyId)
    external payable onlyOwner propertyExists(propertyId)
{
    Property storage property = properties[propertyId];
    require(!property.sold, "Property already sold");
    require(msg.value > 0, "Must send sale proceeds");

    property.sold = true;
    property.saleProceeds = msg.value;
    property.fractionalized = false; // Stop new purchases

    emit PropertySold(propertyId, msg.value, msg.value / property.totalShares);
}

// Investor calls this to redeem their shares for sale proceeds
function claimSaleProceeds(uint256 propertyId)
    external propertyExists(propertyId)
{
    Property storage property = properties[propertyId];
    require(property.sold, "Property not sold yet");

    PropertyShares shareToken = PropertyShares(property.shareToken);
    uint256 shares = shareToken.balanceOf(msg.sender);
    require(shares > 0, "No shares to redeem");

    // Calculate investor's portion of sale proceeds
    uint256 payout = (shares * property.saleProceeds) / property.totalShares;
    require(payout > 0, "Nothing to claim");

    // Burn shares by transferring back to contract (or to address(0) with burn function)
    bool success = shareToken.transferFrom(msg.sender, address(this), shares);
    require(success, "Share redemption failed");

    payable(msg.sender).transfer(payout);

    emit SaleProceedsClaimed(propertyId, msg.sender, payout, shares);
}
```

**Frontend changes**:
- AdminPanel: "Initiate Property Sale" button with sale price input (shown when property is loaded and not sold)
- PropertyDashboard: "SOLD" badge when `property.sold = true`
- InvestorActions: "Claim Sale Proceeds" button replacing "Buy Shares" when property is sold. Show projected payout.

---

### Feature 1: Secondary Market / Share Trading

**What it is**: Investors can list their shares for sale at a custom price. Other investors can buy listed shares directly. Creates a liquid market for fractional real estate.

**New contract**: `Marketplace.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenIT.sol";
import "./PropertyShares.sol";

contract Marketplace {

    struct Listing {
        uint256 listingId;
        uint256 propertyId;
        address seller;
        uint256 shares;         // Number of shares listed
        uint256 pricePerShare;  // In wei
        bool active;
    }

    TokenIT public immutable tokenIT;
    uint256 public listingCounter;
    mapping(uint256 => Listing) public listings;

    // Per-property active listings for easy querying
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
        address indexed buyer,
        uint256 shares,
        uint256 totalCost
    );

    event ListingCancelled(uint256 indexed listingId);

    constructor(address _tokenIT) {
        require(_tokenIT != address(0), "Invalid TokenIT address");
        tokenIT = TokenIT(_tokenIT);
    }

    // Seller lists shares (must approve Marketplace to transfer their shares first)
    function createListing(
        uint256 propertyId,
        uint256 shares,
        uint256 pricePerShare
    ) external returns (uint256) {
        require(shares > 0, "Shares must be greater than zero");
        require(pricePerShare > 0, "Price must be greater than zero");

        // Get share token for this property
        (,, address shareTokenAddr,,,,,,,) = tokenIT.properties(propertyId);
        PropertyShares shareToken = PropertyShares(shareTokenAddr);

        require(shareToken.balanceOf(msg.sender) >= shares, "Insufficient shares");
        require(
            shareToken.allowance(msg.sender, address(this)) >= shares,
            "Approve Marketplace to transfer your shares first"
        );

        listingCounter++;
        listings[listingCounter] = Listing({
            listingId: listingCounter,
            propertyId: propertyId,
            seller: msg.sender,
            shares: shares,
            pricePerShare: pricePerShare,
            active: true
        });
        propertyListings[propertyId].push(listingCounter);

        emit ListingCreated(listingCounter, propertyId, msg.sender, shares, pricePerShare);
        return listingCounter;
    }

    // Buyer purchases a listing
    function buyListing(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy your own listing");

        uint256 totalCost = listing.shares * listing.pricePerShare;
        require(msg.value >= totalCost, "Insufficient payment");

        // Mark inactive before transfers (CEI)
        listing.active = false;

        // Transfer shares from seller to buyer
        (,, address shareTokenAddr,,,,,,,) = tokenIT.properties(listing.propertyId);
        PropertyShares shareToken = PropertyShares(shareTokenAddr);
        bool success = shareToken.transferFrom(listing.seller, msg.sender, listing.shares);
        require(success, "Share transfer failed");

        // Pay seller
        payable(listing.seller).transfer(totalCost);

        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit ListingFilled(listingId, msg.sender, listing.shares, totalCost);
    }

    // Seller cancels their listing
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not your listing");
        require(listing.active, "Listing not active");
        listing.active = false;
        emit ListingCancelled(listingId);
    }

    // Get all active listings for a property
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
            if (listings[ids[i]].active) {
                result[j++] = listings[ids[i]];
            }
        }
        return result;
    }
}
```

**Frontend changes**:
- Add `Marketplace.jsx` component with two tabs: "Active Listings" and "List My Shares"
- List My Shares: input shares + price, calls `shareToken.approve(marketplace, amount)` then `marketplace.createListing`
- Active Listings: shows table of listings with Buy button
- Add Marketplace contract address to `config.js` after deployment

**Deployment**: Add `Marketplace.sol` to deploy script:
```js
const Marketplace = await ethers.getContractFactory("Marketplace");
const marketplace = await Marketplace.deploy(tokenITAddress);
```

---

## Phase Summary

| Phase | Features | Contract Changes | Risk | Estimate |
|-------|----------|-----------------|------|---------|
| **Phase 1** | Portfolio Dashboard, Property Detail | None | Low | Frontend work only |
| **Phase 2** | Valuation Updates, KYC/Whitelist, DRIP | Extend `TokenIT.sol` | Medium | Requires redeploy |
| **Phase 3** | Property Sale/Exit, Secondary Market | New functions + new `Marketplace.sol` | High | Requires thorough testing |

**Order of implementation**: Complete Phase 1 first (zero risk, visible results for demo), then Phase 2 (extends current contract, straightforward additions), then Phase 3 (highest complexity, new contract interactions).
