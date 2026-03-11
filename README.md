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
- **Tokenize Real Estate Properties** - Convert property value into digital shares
- **Buy/Sell Fractional Shares** - Invest in real estate with small amounts
- **Receive Rental Income** - Automated dividend distribution to shareholders
- **Transfer Shares** - P2P trading of property ownership

---

## ✨ Features

### Core Features
- 🏠 **Property Registration** - Register properties with location, value, and shares
- 💰 **Fractional Ownership** - Buy shares of properties with ETH
- 🏦 **Rent Distribution** - Admin deposits rent, investors claim dividends proportionally
- 💵 **Share Sale Proceeds** - Admin can withdraw ETH from share sales (separate from rent)
- 📊 **Purchase Limits** - Set min/max shares per purchase, 50% anti-whale protection
- 🔄 **Share Transfers** - Transfer shares between investors

### New Features (v2.0)
- ✅ **Separate Rent Pool & Share Sale Proceeds** - Rent and share sales tracked separately
- ✅ **Admin Withdrawal** - Withdraw share sale proceeds to admin wallet
- ✅ **Purchase Validation** - Min/max purchase limits per property
- ✅ **Anti-Whale Protection** - Cannot buy more than 50% of available shares at once
- ✅ **Available Shares Display** - Real-time available shares tracking

---

## 🏗️ Architecture

### Smart Contracts

| Contract | Description |
|----------|-------------|
| `TokenIT.sol` | Main platform contract - manages properties, shares, dividends, and proceeds |
| `PropertyNFT.sol` | ERC721 NFT contract representing physical properties |
| `PropertyShares.sol` | ERC20 token contract for fractional property shares |

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

✅ PropertyNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ TokenIT deployed to:     0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

> 📝 **Note**: Copy these addresses - you'll need them if the frontend config doesn't match.

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
- Enter Property ID (e.g., "1") 
- Click "Load Property"
- View: Total Shares, Available Shares, Rent Pool, Share Sale Proceeds

#### 2. Deposit Rent
1. In Admin Panel, find "Deposit Rental Income" section
2. Enter amount (e.g., "10" for 10 ETH)
3. Click "Deposit Rent"
4. Confirm in MetaMask
5. Rent is distributed proportionally to shareholders

#### 3. Withdraw Share Sale Proceeds
1. In Admin Panel, find "Share Sale Proceeds" section (green)
2. View "Available to Withdraw" amount
3. Enter amount to withdraw (leave empty for all)
4. Click "Withdraw Proceeds"
5. ETH is transferred to admin wallet

> 💡 **Note**: Share sale proceeds come from investors buying shares. This is separate from the rent pool.

---

### As Investor (Account #1 or #2)

#### 1. Buy Shares
1. Switch to Investor account in MetaMask
2. Load a property (e.g., Property ID "1")
3. In "Investor Actions" panel:
   - View available shares
   - Check min/max purchase limits
   - Enter number of shares
   - View total cost (auto-calculated)
4. Click "Buy Shares"
5. Confirm transaction in MetaMask

#### 2. Claim Dividends
1. After admin deposits rent, check "Pending Dividends"
2. Click "Claim Dividends"
3. ETH is transferred to your wallet

> 💡 **Note**: Dividends = (Your Shares / Total Shares) × Rent Pool

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
| `npm run deploy` | Deploy contracts to local network |
| `npm run demo` | Run full demo with sample data |
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run contract tests |
| `npx hardhat run scripts/setup-demo.js --network localhost` | Setup demo properties |
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
│   ├── TokenIT.sol         # Main platform contract
│   ├── PropertyNFT.sol     # Property NFT contract
│   ├── PropertyShares.sol  # Share token contract
│   └── RET.sol             # (placeholder)
├── scripts/                 # Deployment & utility scripts
│   ├── deploy.js           # Deploy contracts
│   ├── demo.js             # Run demo scenario
│   ├── setup-demo.js       # Setup demo properties
│   ├── create-property.js  # Interactive property creation
│   └── check-contract.js   # Verify contract state
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── InvestorActions.jsx
│   │   │   ├── PropertyDashboard.jsx
│   │   │   └── Header.jsx
│   │   ├── contracts/      # Contract ABIs & config
│   │   │   └── config.js
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useProperty.js
│   │   └── App.jsx         # Main app component
│   └── package.json
├── test/                    # Contract test files
├── hardhat.config.js        # Hardhat configuration
├── package.json             # Root package.json
└── README.md                # This file
```

---

## 🔄 Money Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN CREATES PROPERTY                          │
│  Location: "123 Main St" | Value: 100 ETH | Shares: 1000           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        INVESTOR BUYS SHARES                         │
│  100 Shares × 0.1 ETH = 10 ETH → TokenIT Contract                   │
│  • 10 ETH added to shareSaleProceeds (admin withdrawable)          │
│  • 100 shares transferred to investor                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN DEPOSITS RENT                          │
│  10 ETH → TokenIT Contract                                          │
│  • 10 ETH added to rentPool (investor dividends)                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      INVESTOR CLAIMS DIVIDENDS                      │
│  (100 shares / 1000 total) × 10 ETH rent = 1 ETH dividend          │
│  • 1 ETH transferred to investor wallet                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN WITHDRAWS PROCEEDS                        │
│  10 ETH from shareSaleProceeds → Admin wallet                       │
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
