# TokenIT - Real Estate Tokenization Platform

A blockchain-based Real Estate Investment Trust (REIT) platform that enables property tokenization, fractional ownership, and automated dividend distribution through smart contracts.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [MetaMask Setup](#metamask-setup)
- [Test Accounts](#test-accounts)
- [Usage Guide](#usage-guide)
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

## 🏗️ Architecture

### Smart Contracts

| Contract | Description |
|----------|-------------|
| `TokenIT.sol` | Main platform contract - manages properties, shares, and dividends |
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

### Step 1: Clone and Setup

```bash
# Navigate to project directory
cd RET-RealEstateTokenization

# Install root dependencies (Hardhat + Smart Contracts)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 🚀 Running the Project

### Phase 1: Start the Blockchain (Terminal 1)

Start the Hardhat local blockchain node:

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
Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
...
```

> ⚠️ **Important**: Keep this terminal running! This is your local blockchain.

### Phase 2: Deploy Contracts (Terminal 2)

In a new terminal, deploy the smart contracts:

```bash
# Deploy contracts to local network
npm run deploy
```

**Expected Output:**
```
==========================================
     TokenIT Contract Deployment
==========================================

Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000.0 ETH

------------------------------------------
Step 1: Deploying PropertyNFT contract...
------------------------------------------
✅ PropertyNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

------------------------------------------
Step 2: Deploying TokenIT contract...
------------------------------------------
✅ TokenIT deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

==========================================
     Deployment Summary
==========================================
PropertyNFT: 0x5FbDB2315678afecb367f032d93F642f64180aa3
TokenIT:     0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Phase 3: Run Demo (Optional)

To populate the platform with sample data:

```bash
npm run demo
```

This creates:
- 1 tokenized property (1000 shares, 100 ETH value)
- 2 investors with purchased shares
- Rental income deposited
- Dividends claimed

### Phase 4: Start Frontend (Terminal 3)

In another terminal, start the React frontend:

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open your browser and navigate to: **http://localhost:5173/**

---

## 🦊 MetaMask Setup

### Step 1: Add Hardhat Network to MetaMask

1. Open MetaMask extension
2. Click the network dropdown (top of the popup)
3. Click **"Add network"** → **"Add a network manually"**
4. Enter these details:

| Field | Value |
|-------|-------|
| **Network Name** | Hardhat Local |
| **New RPC URL** | http://127.0.0.1:8545 |
| **Chain ID** | 31337 |
| **Currency Symbol** | ETH |
| **Block Explorer URL** | (leave empty) |

5. Click **Save**

### Step 2: Import Test Accounts

Import these accounts using their **Private Keys**:

#### Account #0 - Admin (Platform Owner)
- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Role**: Deploy contracts, create properties, deposit rent
- **Balance**: 10,000 ETH

#### Account #1 - Investor 1
- **Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Role**: Buy shares, claim dividends
- **Balance**: 10,000 ETH

#### Account #2 - Investor 2
- **Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **Role**: Buy shares, claim dividends
- **Balance**: 10,000 ETH

#### Account #3 - Investor 3
- **Address**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Private Key**: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **Role**: Receive transferred shares
- **Balance**: 10,000 ETH

### How to Import an Account:

1. Click the **account icon** (top right in MetaMask)
2. Select **"Import account"**
3. Paste the **Private Key**
4. Click **Import**
5. Rename the account (e.g., "Admin", "Investor 1")

---

## 📝 Test Accounts Summary

| Account | Address | Private Key | Purpose |
|---------|---------|-------------|---------|
| #0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 | Admin/Deployer |
| #1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d | Investor 1 |
| #2 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a | Investor 2 |
| #3 | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 | Investor 3 |

---

## 🎮 Usage Guide

### As Admin (Account #0)

1. **Connect Wallet**: Open http://localhost:5173/ and click "Connect Wallet"
2. **Create Property**: 
   - Go to "Admin Panel"
   - Enter location (e.g., "123 Main St, New York")
   - Enter value (e.g., "100" for 100 ETH)
   - Enter total shares (e.g., "1000")
   - Click "Register & Fractionalize"
3. **Deposit Rent**:
   - Enter property ID
   - Enter rent amount (e.g., "10" for 10 ETH)
   - Click "Deposit Rent"

### As Investor (Account #1 or #2)

1. **Switch Account**: In MetaMask, switch to Investor account
2. **Buy Shares**:
   - View available properties on dashboard
   - Enter property ID and amount of shares
   - Click "Buy Shares"
3. **Claim Dividends**:
   - After rent is deposited, click "Claim Dividends"
   - ETH will be sent to your wallet

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run node` | Start Hardhat local blockchain |
| `npm run deploy` | Deploy contracts to local network |
| `npm run demo` | Run full demo with sample data |
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run contract tests |
| `npm run create-property` | Create a property via script |
| `cd frontend && npm run dev` | Start React frontend |
| `cd frontend && npm run build` | Build for production |

---

## 🐛 Troubleshooting

### Issue: "MetaMask is not installed"
**Solution**: Install MetaMask extension for your browser and refresh the page.

### Issue: "Failed to connect to wallet"
**Solution**: 
- Ensure you're on the Hardhat Local network in MetaMask
- Check that the Hardhat node is running (`npm run node`)
- Try refreshing the page

### Issue: "Network mismatch"
**Solution**: 
- In MetaMask, switch to the Hardhat Local network (Chain ID: 31337)
- If prompted, add the network (see [MetaMask Setup](#metamask-setup))

### Issue: "Insufficient funds"
**Solution**: 
- Make sure you're using a test account from Hardhat
- The Hardhat node must be running to have the prefunded accounts

### Issue: "Contract not deployed"
**Solution**: 
- Run `npm run deploy` to deploy contracts
- Check that the contract addresses in `frontend/src/contracts/config.js` match the deployed addresses

### Issue: "Nonce too high" or transaction errors
**Solution**: 
- In MetaMask, go to Settings → Advanced → Clear Activity Tab Data
- Or reset your MetaMask account for the Hardhat network

### Issue: Frontend shows "Error: could not detect network"
**Solution**: 
- Ensure Hardhat node is running (`npm run node`)
- Check if the RPC URL in MetaMask is `http://127.0.0.1:8545`
- Try restarting the Hardhat node

### Issue: Cannot buy shares / transaction fails
**Solution**:
- Check that you're sending enough ETH (share price × amount)
- Verify the property is fractionalized
- Check browser console for detailed error messages

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
│   ├── create-property.js  # Create property script
│   └── check-contract.js   # Verify contract state
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contracts/      # Contract ABIs & config
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.jsx         # Main app component
│   └── package.json
├── test/                    # Contract test files
├── hardhat.config.js        # Hardhat configuration
└── package.json             # Root package.json
```

---

## 🔄 Workflow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Admin     │────▶│  TokenIT     │────▶│ Property    │
│  (Account)  │     │  Contract    │     │  Shares     │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                    │
       │ Register           │ Mint Shares        │ Sell
       │ Property           │                    │ Shares
       ▼                    ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Property   │     │  Investors   │◀────│   Investor  │
│    NFT      │     │  (Dividends) │     │  (Account)  │
└─────────────┘     └──────────────┘     └─────────────┘
       ▲                                           │
       │                                           │
       └────────── Rent Deposit ◀──────────────────┘
```

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the console logs in browser and terminal
3. Ensure all prerequisites are met

---

## 📄 License

MIT License - University Project
