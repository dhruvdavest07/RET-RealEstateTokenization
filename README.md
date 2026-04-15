# TokenIT - Real Estate Tokenization Platform

A blockchain-based Real Estate Investment Trust (REIT) platform that enables property tokenization, fractional ownership, and automated dividend distribution through smart contracts.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Detailed Setup Guide](#detailed-setup-guide)
- [Property Creation](#property-creation)
- [Usage Guide](#usage-guide)
- [MetaMask Setup](#metamask-setup)
- [Test Accounts](#test-accounts)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

---

## 🏢 Overview

TokenIT allows users to:
- **Tokenize Real Estate Properties** — Convert property value into digital shares (ERC20 token per property)
- **Buy Fractional Shares** — Invest in real estate with small amounts of ETH
- **Receive Rental Income** — Automated dividend distribution to shareholders proportional to ownership
- **Reinvest Dividends (DRIP)** — Convert dividends directly into more shares for compound growth
- **Transfer Shares P2P** — Direct wallet-to-wallet share transfers
- **Secondary Market** — List and trade shares at custom prices via the Marketplace contract
- **KYC Compliance** — Admin-controlled whitelist for regulatory compliance
- **Property Exit** — Admin can sell the physical property; investors redeem shares for their ETH payout

---

## ✨ Features

### Core Features (v1.0)
- 🏠 **Property Registration** - Register properties with location, value, and shares
- 💰 **Fractional Ownership** - Buy shares of properties with ETH
- 🏦 **Rent Distribution** - Admin deposits rent, investors claim dividends proportionally
- 💵 **Share Sale Proceeds** - Admin withdraws ETH from share sales (separate from rent pool)
- 📊 **Purchase Limits** - Set min/max shares per purchase, 50% anti-whale protection
- 🔄 **Share Transfers** - Transfer shares P2P (no ERC20 approval required)
- 📈 **Portfolio Dashboard** - View all holdings, total value, and pending dividends across properties
- 🔍 **Property Detail Page** - Full event history: rent deposits, purchases, dividend claims

### Phase 2 Features (v2.0)
- ✅ **Property Valuation Updates** - Admin recalculates share price on market appreciation/depreciation
- ✅ **KYC / Investor Whitelist** - Toggle-able compliance layer; only approved addresses can buy shares
- ✅ **DRIP Reinvestment** - Convert dividends directly into more shares; live preview before committing

### Phase 3 Features (v3.0)
- ✅ **Property Sale / Exit** - Admin initiates full property sale; investors redeem shares for proportional ETH payout; shares are burned on redemption
- ✅ **Secondary Market** - Peer-to-peer share marketplace; list shares at custom prices, buy or cancel listings

---

## 🏗️ Architecture

### Smart Contracts

| Contract | Description |
|----------|-------------|
| `TokenIT.sol` | Main platform contract — property registry, share distribution, rent pool, dividends, KYC whitelist, valuation updates, DRIP, property sale/exit |
| `PropertyNFT.sol` | ERC721 NFT representing the physical property title deed |
| `PropertyShares.sol` | ERC20 fractional ownership token — one deployment per property; includes `transferOnBehalf` and `burnShares` helpers for TokenIT |
| `Marketplace.sol` | Secondary market for peer-to-peer share trading at custom prices |

### Tech Stack

- **Blockchain**: Ethereum (Hardhat Local Network)
- **Smart Contracts**: Solidity ^0.8.20
- **Frontend**: React + Vite + TailwindCSS
- **Web3 Library**: Ethers.js v5
- **Wallet**: MetaMask

---

## ⚙️ Prerequisites

Before running the project, ensure you have:

1. **Node.js** (v16 or higher)
   ```bash
   node --version
   ```

2. **npm** or **yarn**
   ```bash
   npm --version
   ```

3. **MetaMask Browser Extension**
   - [Chrome Extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)
   - [Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/)

---

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/dhruvdavest07/RET-RealEstateTokenization.git
cd RET-RealEstateTokenization
```

### Step 2: Install Dependencies

```bash
# Install root dependencies (Hardhat + Smart Contracts)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 🚀 Quick Start

Run these commands in **3 separate terminals**:

### Terminal 1: Start Blockchain
```bash
npm run node
```

### Terminal 2: Deploy Contracts
```bash
npm run deploy
```

### Terminal 3: Setup Demo & Start Frontend
```bash
# Setup demo with sample properties
npx hardhat run scripts/setup-demo.js --network localhost

# Start frontend
cd frontend
npm run dev
```

**Open browser:** http://localhost:5173 (or http://localhost:3003 if 5173 is taken)

---

## 📖 Detailed Setup Guide

### Step 1: Start the Local Blockchain

Open **Terminal 1** and run:

```bash
npm run node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

> ⚠️ **Important**: Keep this terminal running! This is your local blockchain.

---

### Step 2: Deploy Smart Contracts

Open **Terminal 2** and run:

```bash
npm run deploy
```

**Expected Output:**
```
==========================================
     TokenIT Contract Deployment
==========================================

✅ PropertyNFT deployed to:  0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ TokenIT deployed to:      0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ Marketplace deployed to:  0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

Update frontend/src/contracts/config.js:
  TOKEN_IT:    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  PROPERTY_NFT:"0x5FbDB2315678afecb367f032d93F642f64180aa3",
  MARKETPLACE: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
```

> 📝 **Note**: `TOKEN_IT` and `PROPERTY_NFT` are deterministic (always the same on a fresh node). `MARKETPLACE` must be copied into `config.js` after each redeploy.

---

### Step 3: Setup MetaMask

1. **Add Hardhat Network:**
   - Open MetaMask → Click network dropdown → "Add network" → "Add manually"
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Admin Account:**
   - Click account icon → "Import account"
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Rename to "Admin"

---

### Step 4: Create Demo Properties (Optional but Recommended)

Open **Terminal 3** and run:

```bash
npx hardhat run scripts/setup-demo.js --network localhost
```

This creates:
- **Property #1**: Luxury Apartment in NYC (1000 shares, 0.1 ETH each)
- **Property #2**: Office Building in Chicago (2500 shares, 0.1 ETH each)
- Pre-populates with investor share purchases
- Deposits sample rent

---

### Step 5: Start Frontend

In **Terminal 3**:

```bash
cd frontend
npm run dev
```

Open browser: **http://localhost:5173**

---

## 🏠 Property Creation

### Method 1: Via Web Interface (Admin Only)

1. **Connect Admin Wallet**
   - Open http://localhost:5173
   - Click "Connect Wallet"
   - Select Admin account in MetaMask

2. **No Property Loaded State**
   - Clear Property ID field or set to non-existent property
   - Admin Panel shows "Register New Property" form

3. **Fill Property Details:**
   | Field | Example Value | Description |
   |-------|---------------|-------------|
   | Location | `123 Park Avenue, New York` | Property address |
   | Value (ETH) | `100` | Total property value |
   | Total Shares | `1000` | Number of shares to create |
   | Min Purchase | `10` | Minimum shares per purchase |
   | Max Purchase | `200` | Maximum shares per purchase (0 = unlimited) |

4. **Click "Register & Fractionalize"**
   - Confirm transaction in MetaMask
   - New property ID will be displayed
   - Property automatically loads

---

### Method 2: Via Script (Admin Only)

Create a new file `scripts/create-my-property.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  
  // Use deployed contract address
  const tokenITAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  const TokenIT = await ethers.getContractFactory("TokenIT");
  const tokenIT = TokenIT.attach(tokenITAddress);

  console.log("Creating new property...");

  // Create property with purchase limits
  const tx = await tokenIT['registerAndFractionalizeProperty(string,uint256,uint256,uint256,uint256)'](
    "789 Ocean Drive, Miami, FL",  // Location
    ethers.utils.parseEther("150"), // Value: 150 ETH
    1500,                           // Total Shares
    15,                             // Min Purchase: 15 shares
    300                             // Max Purchase: 300 shares
  );
  
  const receipt = await tx.wait();
  
  // Get property ID from event
  const event = receipt.logs.find(log => {
    try {
      const parsed = tokenIT.interface.parseLog(log);
      return parsed && parsed.name === "PropertyFractionalized";
    } catch (e) { return false; }
  });
  
  if (event) {
    const parsed = tokenIT.interface.parseLog(event);
    const propertyId = parsed.args.propertyId.toString();
    console.log(`✅ Property #${propertyId} created!`);
    console.log(`   Share Price: ${ethers.utils.formatEther(parsed.args.sharePrice)} ETH`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run the script:
```bash
npx hardhat run scripts/create-my-property.js --network localhost
```

---

## 🎮 Usage Guide

### As Admin (Account #0)

#### 1. View Property Details
- Enter Property ID (e.g., "1"), click "Load Property"
- View: Total Shares, Available Shares, Rent Pool, Share Sale Proceeds

#### 2. Deposit Rent
1. Admin Panel → "Deposit Rental Income" → enter amount → click **Deposit Rent** → confirm MetaMask

#### 3. Withdraw Share Sale Proceeds
1. Admin Panel → "Share Sale Proceeds" (green section) → leave amount blank for all → **Withdraw Proceeds**

#### 4. Update Property Value (Phase 2)
1. Admin Panel → "Update Property Value" (collapsible)
2. Enter new total value in ETH — new share price previewed live
3. Click **Update Value** → confirms new share price on-chain

#### 5. Manage KYC Whitelist (Phase 2)
1. Admin Panel → "KYC Whitelist" (collapsible)
2. Toggle switch to enable/disable requirement
3. Add individual addresses or click **Whitelist all 3 demo investors** for quick demo setup

#### 6. Initiate Property Sale (Phase 3)
1. Admin Panel → "Initiate Property Sale" (red collapsible — irreversible)
2. Enter total sale price in ETH → click **Confirm Property Sale** → confirm dialog → MetaMask
3. You must send that exact ETH value in the transaction

---

### As Investor (Account #1 or #2)

#### 1. Buy Shares
1. Load property → Investor Actions → enter share count → **Buy Shares** → confirm MetaMask
2. If KYC whitelist is active and you are not whitelisted, a yellow banner blocks purchase

#### 2. Claim Dividends
1. After admin deposits rent, "Pending Dividends" appears in Investor Actions
2. Click **Claim Dividends** → ETH transferred to your wallet
> 💡 Dividends = (Your Shares / Total Shares) × Rent Pool

#### 3. Reinvest Dividends — DRIP (Phase 2)
1. When you have pending dividends, a DRIP preview appears below Claim Dividends
2. Shows how many shares your dividends would buy
3. Click **Reinvest → N shares** → shares credited, ETH stays in contract

#### 4. Transfer Shares
1. Investor Actions → "Transfer Shares" → enter recipient address and amount → **Transfer Shares**
2. No ERC20 approval needed — handled internally

#### 5. Claim Sale Proceeds (Phase 3)
1. When a property is sold (SOLD badge on dashboard), "Claim Sale Proceeds" replaces "Buy Shares"
2. Shows your exact ETH payout based on shares owned
3. Click **Redeem Shares for Sale Proceeds** → shares burned, ETH received

#### 6. Secondary Market (Phase 3)
1. Click **Secondary Market** tab in the top navigation
2. **Sell Shares tab**: enter property ID, share amount, price per share → **Approve & List Shares** (2 MetaMask confirmations: ERC20 approval + listing)
3. **Browse tab**: see active listings from other investors → click **Buy** to purchase
4. **My Listings tab**: view your active listings → click **Cancel** to remove

---

## 🦊 MetaMask Setup

### Add Hardhat Network

1. Open MetaMask extension
2. Click network dropdown (top of popup)
3. Click **"Add network"** → **"Add a network manually"**
4. Enter:

| Field | Value |
|-------|-------|
| **Network Name** | Hardhat Local |
| **New RPC URL** | http://127.0.0.1:8545 |
| **Chain ID** | 31337 |
| **Currency Symbol** | ETH |
| **Block Explorer URL** | (leave empty) |

5. Click **Save**

### Import Test Accounts

| Account | Address | Private Key | Purpose |
|---------|---------|-------------|---------|
| **Admin** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` | Deploy/Create properties |
| **Investor 1** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` | Buy shares/Claim dividends |
| **Investor 2** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` | Buy shares/Claim dividends |
| **Investor 3** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` | Receive transfers |

**How to Import:**
1. Click account icon (top right) → "Import account"
2. Paste Private Key
3. Click Import
4. Rename account (e.g., "Admin", "Investor 1")

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run node` | Start Hardhat local blockchain |
| `npm run deploy` | Deploy all 3 contracts (PropertyNFT, TokenIT, Marketplace) |
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run contract tests |
| `npx hardhat run scripts/setup-demo.js --network localhost` | Setup demo properties with sample data |
| `cd frontend && npm run dev` | Start React frontend |
| `cd frontend && npm run build` | Build for production |

---

## 🐛 Troubleshooting

### Issue: "MetaMask is not installed"
**Solution**: Install MetaMask extension and refresh the page.

### Issue: "Failed to connect to wallet"
**Solution**: 
- Ensure you're on Hardhat Local network
- Check Hardhat node is running (`npm run node`)
- Refresh the page

### Issue: "No contract found at 0x..."
**Solution**: 
- Hardhat node was reset - contracts lost
- Re-run: `npm run deploy`
- Update `frontend/src/contracts/config.js` with new addresses

### Issue: "Dividends show 0 but rent was deposited"
**Solution**: 
- You may have already claimed
- Check `claimedDividends` in contract
- Another investor may have claimed before you

### Issue: "Withdraw proceeds doesn't add ETH to wallet"
**Solution**: 
- Check browser console for errors
- Verify you're using Admin account
- Ensure contract has ETH balance
- Refresh page after transaction

### Issue: "Nonce too high" or transaction errors
**Solution**: 
- MetaMask → Settings → Advanced → Clear Activity Tab Data
- Or reset MetaMask account for Hardhat network

### Issue: "Cannot buy shares - transaction fails"
**Solution**:
- Check you're sending enough ETH (share price × amount)
- Verify purchase is within min/max limits
- Cannot buy more than 50% of available shares at once
- Check browser console for error details

---

## 📁 Project Structure

```
RET-RealEstateTokenization/
├── contracts/               # Solidity smart contracts
│   ├── TokenIT.sol         # Main platform contract (Phase 1-3)
│   ├── PropertyNFT.sol     # Property ERC721 NFT contract
│   ├── PropertyShares.sol  # Fractional share ERC20 token
│   ├── Marketplace.sol     # Secondary market (Phase 3)
│   └── RET.sol             # (placeholder)
├── scripts/                 # Deployment & utility scripts
│   ├── deploy.js           # Deploy all 3 contracts
│   ├── setup-demo.js       # Setup demo properties + data
│   ├── create-property.js  # Interactive property creation
│   └── check-contract.js   # Verify contract state
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPanel.jsx        # Admin controls (Phase 1-3)
│   │   │   ├── InvestorActions.jsx   # Buy, dividends, DRIP, sale proceeds
│   │   │   ├── PropertyDashboard.jsx # Property stats + SOLD badge
│   │   │   ├── PortfolioDashboard.jsx # My Portfolio tab (Phase 1)
│   │   │   ├── PropertyDetail.jsx    # Event history modal (Phase 1)
│   │   │   ├── Marketplace.jsx       # Secondary market UI (Phase 3)
│   │   │   └── Header.jsx
│   │   ├── contracts/
│   │   │   └── config.js   # Contract addresses + ABIs (all 4 contracts)
│   │   ├── hooks/
│   │   │   ├── useWeb3.js          # Wallet + contract instances
│   │   │   ├── useProperty.js      # TokenIT interactions
│   │   │   └── useMarketplace.js   # Marketplace interactions (Phase 3)
│   │   └── App.jsx         # Main app — tabs, state, handlers
│   └── package.json
├── test/                    # Contract test files
├── DEMO_GUIDE.md            # Full demo + ngrok setup guide
├── PROJECT_UNDERSTANDING.md # Evaluation prep + viva Q&A
├── IMPLEMENTATION_PHASES.md # Phase planning document
├── hardhat.config.js
└── package.json
```

---

## 🔄 Money Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN CREATES PROPERTY                          │
│  Location: "123 Main St" | Value: 100 ETH | Shares: 1000           │
│  → sharePrice = 100/1000 = 0.1 ETH per share                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INVESTOR BUYS SHARES (primary)                  │
│  100 shares × 0.1 ETH = 10 ETH → TokenIT Contract                  │
│  • 10 ETH added to shareSaleProceeds (admin withdrawable)          │
│  • 100 shares transferred to investor wallet                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               SECONDARY MARKET (Marketplace.sol)                    │
│  Investor A lists 50 shares at 0.12 ETH each                       │
│  Investor B buys → 6 ETH paid directly to Investor A               │
│  • No ETH enters TokenIT — P2P settlement                          │
│  • Share ownership updated on PropertyShares ERC20                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN DEPOSITS RENT                          │
│  10 ETH → TokenIT Contract → added to rentPool                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
┌────────────────────────┐  ┌─────────────────────────────────────────┐
│  INVESTOR CLAIMS ETH   │  │   INVESTOR REINVESTS (DRIP)             │
│  1 ETH dividend paid   │  │   1 ETH dividend → 10 more shares      │
│  out of rentPool       │  │   ETH stays in contract as proceeds     │
└────────────────────────┘  └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN WITHDRAWS PROCEEDS                        │
│  shareSaleProceeds (from share sales + DRIP) → Admin wallet        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               PROPERTY SALE / EXIT (Phase 3)                        │
│  Admin calls initiatePropertySale, sends 120 ETH                   │
│  • Property marked SOLD, no more share purchases                    │
│  • Investors call claimSaleProceeds:                                │
│    100 shares / 1000 total × 120 ETH = 12 ETH per investor         │
│  • Shares burned on redemption                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review console logs in browser (F12 → Console) and terminal
3. Ensure all prerequisites are met
4. Verify contract addresses match in `frontend/src/contracts/config.js`

---

## 📄 License

MIT License - University Project
