# TokenIT Frontend

A React-based DApp for interacting with the TokenIT blockchain REIT platform.

## Features

- 🔗 **MetaMask Integration** - Connect your wallet securely
- 🏠 **Property Dashboard** - View property details, share prices, and rent pool
- 💰 **Buy Shares** - Purchase fractional ownership of properties
- 💸 **Claim Dividends** - Receive rental income distributions
- 🔐 **Admin Panel** - Deposit rental income (admin only)
- ⚡ **Real-time Updates** - Auto-refresh investor data

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Ethers.js v5
- MetaMask Web3 Provider

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Contract Addresses

Open `src/contracts/config.js` and update with your deployed contract addresses:

```javascript
export const CONTRACT_ADDRESSES = {
  // Your deployed TokenIT contract address
  TOKEN_IT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  
  // Your deployed PropertyNFT contract address  
  PROPERTY_NFT: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
};
```

To get your contract addresses:
```bash
# In your Hardhat project directory
npm run deploy
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 4. Setup MetaMask

1. Install [MetaMask](https://metamask.io/) browser extension
2. Add Hardhat Local Network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. Import a test account using the private key from Hardhat

## Usage Guide

### For Investors

1. **Connect Wallet** - Click "Connect MetaMask" in the header
2. **Select Property** - Enter a property ID (start with "1") and click "Load Property"
3. **Buy Shares** - Enter the number of shares and click "Buy Shares"
4. **Wait for Rent** - The admin will deposit rental income
5. **Claim Dividends** - Click "Claim Dividends" when rent is available

### For Admin

1. **Access Admin Panel** - Connect with the admin wallet (deployer address)
2. **Deposit Rent** - Enter the amount of ETH and click "Deposit Rent"
3. **Distribute Income** - Rent is automatically distributed to all shareholders

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Wallet connection header
│   │   ├── PropertyDashboard.jsx # Property details display
│   │   ├── InvestorActions.jsx   # Buy shares & claim dividends
│   │   └── AdminPanel.jsx        # Admin functions
│   ├── contracts/
│   │   └── config.js           # Contract addresses & ABIs
│   ├── hooks/
│   │   ├── useWeb3.js          # Wallet connection hook
│   │   └── useProperty.js      # Contract interaction hook
│   ├── App.jsx                 # Main application
│   ├── index.css               # Tailwind styles
│   └── main.jsx                # Entry point
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Contract ABIs

The ABIs are already included in `src/contracts/config.js`. If you modify the smart contracts:

1. Recompile contracts in Hardhat
2. Copy new ABIs from `artifacts/contracts/`
3. Update the ABI arrays in `config.js`

## Troubleshooting

### MetaMask not connecting
- Make sure MetaMask is installed and unlocked
- Check that you're on the Hardhat Local network (Chain ID: 31337)
- Try refreshing the page

### Contract not found
- Verify contract addresses in `config.js` are correct
- Ensure Hardhat node is running: `npx hardhat node`
- Redeploy contracts if needed: `npm run deploy`

### Transaction failing
- Check you have enough ETH in your wallet
- Verify gas limit is sufficient
- Check console for detailed error messages

## Demo Flow

1. Start Hardhat node in project root:
   ```bash
   npx hardhat node
   ```

2. Deploy contracts:
   ```bash
   npm run deploy
   ```

3. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

4. Connect MetaMask to Hardhat Local network

5. Import admin account (private key from Hardhat)

6. Create a property and fractionalize it

7. Switch to investor account

8. Buy shares, claim dividends!

## License

MIT - University Project
