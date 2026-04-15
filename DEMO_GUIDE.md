# TokenIT — Demo & Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Running Locally (Single Machine)](#running-locally-single-machine)
3. [Running with Remote Teammates (ngrok)](#running-with-remote-teammates-ngrok)
4. [MetaMask Setup](#metamask-setup)
5. [Demo Script](#demo-script)
6. [Test Accounts](#test-accounts)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Install these before anything else:

| Tool | Version | Download |
|------|---------|---------|
| Node.js | v16 or higher | https://nodejs.org |
| npm | comes with Node | — |
| MetaMask | latest | Chrome/Firefox extension |
| ngrok (for remote demo) | latest | https://ngrok.com/download |

Check versions:
```bash
node --version   # should be v16+
npm --version
```

---

## Running Locally (Single Machine)

You need **3 terminals** open simultaneously.

### Terminal 1 — Start the Blockchain

```bash
cd RET-RealEstateTokenization
npm install        # only needed first time
npm run node
```

**Leave this running.** You will see 20 test accounts with private keys printed. Keep this terminal open for the entire session.

Expected output:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

> **Important**: Every time you restart the blockchain node, all contracts and data are wiped. You must re-deploy contracts after each restart.

---

### Terminal 2 — Deploy Contracts

```bash
npm run deploy
```

Note down the **three** addresses printed:
```
✅ PropertyNFT deployed to:  0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ TokenIT deployed to:      0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ Marketplace deployed to:  0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

The deploy script also prints a ready-to-paste config block:
```
Update frontend/src/contracts/config.js:
  TOKEN_IT:    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  PROPERTY_NFT:"0x5FbDB2315678afecb367f032d93F642f64180aa3",
  MARKETPLACE: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
```

As long as you start the node fresh (no prior deploys in this session), `TOKEN_IT` and `PROPERTY_NFT` addresses will always be the same — only `MARKETPLACE` varies.

> **If addresses don't match** `config.js`: Open `frontend/src/contracts/config.js` and update all three addresses in the `CONTRACT_ADDRESSES` object.

---

### Terminal 3 — (Optional) Load Demo Data

Skip this if you want to start with a clean slate and create properties via the UI.

```bash
npx hardhat run scripts/setup-demo.js --network localhost
```

This creates:
- Property #1: Luxury Apartment NYC (1000 shares, 0.1 ETH each)
- Property #2: Office Building Chicago (2500 shares, 0.1 ETH each)
- Purchases some shares as investor accounts
- Deposits sample rent

---

### Terminal 3 — Start Frontend

```bash
cd frontend
npm install        # only needed first time
npm run dev
```

Open browser: **http://localhost:5173**

---

## Running with Remote Teammates (ngrok)

Since teammates are not on the same network, you need to tunnel two ports using ngrok:
- Port `8545` — the Hardhat blockchain RPC
- Port `5173` — the React frontend

### Step 1 — Install & Authenticate ngrok

1. Download ngrok from https://ngrok.com/download
2. Create a free account at https://ngrok.com
3. Copy your auth token from the ngrok dashboard
4. Run once to save your token:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

---

### Step 2 — Start Blockchain and Deploy (same as above)

In **Terminal 1**:
```bash
npm run node
```

In **Terminal 2**:
```bash
npm run deploy
```

---

### Step 3 — Tunnel the Blockchain RPC

Open a **new terminal** and run:
```bash
ngrok http 8545
```

You will see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8545
```

**Copy this HTTPS URL** (e.g. `https://abc123.ngrok-free.app`). You will need it in the next step.

> Keep this terminal running. If you restart ngrok, you get a new URL and must redo steps 4 and 5.

---

### Step 4 — Update config.js with the ngrok RPC URL

Open `frontend/src/contracts/config.js` and update the `rpcUrl` field:

```js
export const NETWORK_CONFIG = {
  chainId: "0x7a69",
  chainName: "Hardhat Local",
  rpcUrl: "https://abc123.ngrok-free.app",   // ← paste your ngrok URL here
  ...
};
```

> This tells the frontend (and MetaMask auto-add) to use the public tunnel URL instead of localhost.

---

### Step 5 — Tunnel the Frontend

Open another **new terminal**:
```bash
cd frontend
npm run dev -- --host
```

Then in yet another terminal:
```bash
ngrok http 5173
```

You will see:
```
Forwarding   https://xyz789.ngrok-free.app -> http://localhost:5173
```

**Share this URL** (`https://xyz789.ngrok-free.app`) with your teammates. This is what they open in their browser.

---

### Step 6 — Share with teammates

Send teammates:
1. The **frontend URL**: `https://xyz789.ngrok-free.app`
2. The **RPC URL** (for MetaMask): `https://abc123.ngrok-free.app`
3. The test account private keys from the [Test Accounts](#test-accounts) section below

> **ngrok free tier note**: Free accounts allow 1 agent (meaning 1 ngrok session). To run two tunnels simultaneously, use an ngrok config file:
>
> Create `ngrok.yml`:
> ```yaml
> version: "2"
> authtoken: YOUR_TOKEN_HERE
> tunnels:
>   blockchain:
>     proto: http
>     addr: 8545
>   frontend:
>     proto: http
>     addr: 5173
> ```
>
> Then run: `ngrok start --all --config ngrok.yml`
>
> Both URLs will be printed at once.

---

## MetaMask Setup

Every person participating in the demo needs to do this.

### Add the Hardhat Network

1. Open MetaMask → click the network dropdown at the top
2. Click **Add network** → **Add a network manually**
3. Fill in:

| Field | Value (local) | Value (remote/ngrok) |
|-------|--------------|---------------------|
| Network Name | `Hardhat Local` | `Hardhat Local` |
| New RPC URL | `http://127.0.0.1:8545` | `https://abc123.ngrok-free.app` |
| Chain ID | `31337` | `31337` |
| Currency Symbol | `ETH` | `ETH` |
| Block Explorer URL | *(leave blank)* | *(leave blank)* |

4. Click **Save**
5. Switch to the new network from the network dropdown

### Import a Test Account

1. Click the account icon (top right of MetaMask)
2. Click **Import account**
3. Paste the private key for your role (see table below)
4. Click **Import**
5. Rename the account (click the three dots → Account details → edit the name)

---

## Test Accounts

These are pre-funded Hardhat test accounts. **Do not use on mainnet.**

| Role | Address | Private Key |
|------|---------|-------------|
| **Admin** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Investor 1** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Investor 2** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Investor 3** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

**Assignment for demo:**
- Person 1 (presenter) → Admin
- Person 2 → Investor 1
- Person 3 → Investor 2

---

## Demo Script

Follow this sequence for a clean end-to-end demo. Steps 1–5 are core; Steps 6–9 demonstrate Phase 2 & 3 features.

### Step 1 — Admin creates a property

1. Open the app, connect wallet as **Admin**
2. The Admin Panel shows "Register New Property"
3. Fill in:
   - Location: `123 Park Avenue, New York`
   - Value: `100`
   - Total Shares: `1000`
   - Min Purchase: `10`
   - Max Purchase: `200`
4. Click **Register & Fractionalize** → confirm in MetaMask
5. Property #1 loads automatically

---

### Step 2 — Investors buy shares

Each investor:
1. Opens the app (same URL), connects their wallet
2. Enters Property ID `1`, clicks **Load Property**
3. In Investor Actions, enters a share amount (e.g. `100`)
4. Clicks **Buy Shares** → confirm in MetaMask
5. Dashboard updates: Available Shares decreases, investor sees their shares

---

### Step 3 — Admin deposits rent

1. Admin switches to property #1
2. In Admin Panel → "Deposit Rental Income"
3. Enter `10` (ETH)
4. Click **Deposit Rent** → confirm in MetaMask
5. Rent Pool shows `10 ETH`

---

### Step 4 — Investors claim dividends

Each investor:
1. Loads property #1
2. Checks "Pending Dividends" in the dashboard (proportional to their shares)
3. Clicks **Claim Dividends** → confirm in MetaMask
4. ETH appears in their MetaMask balance

Example: Investor with 100/1000 shares gets `(100/1000) × 10 = 1 ETH`

---

### Step 5 — Admin withdraws share sale proceeds

1. Admin Panel → "Share Sale Proceeds"
2. Shows ETH collected from investor share purchases
3. Leave amount blank → click **Withdraw Proceeds** → confirm in MetaMask
4. ETH transferred to admin wallet

---

### Step 6 — Phase 2: KYC Whitelist demo

1. Admin Panel → "KYC Whitelist" (collapsible)
2. Toggle the switch to **ON** → confirm MetaMask → whitelist enabled
3. Switch to Investor 1 — try to buy shares → blocked with "KYC required" banner
4. Switch back to Admin → "Whitelist all 3 demo investors" → confirm
5. Switch to Investor 1 — green "KYC approved" banner appears → buy works again
6. Toggle whitelist back **OFF** when done to unblock demo flow

---

### Step 7 — Phase 2: Property Valuation Update demo

1. Admin Panel → "Update Property Value" (collapsible)
2. Enter new value e.g. `150` (property appreciated)
3. Preview shows new share price: `150 / 1000 = 0.15 ETH`
4. Click **Update Value** → confirm MetaMask
5. Property Dashboard share price updates — existing holdings are now worth more

---

### Step 8 — Phase 2: DRIP Reinvestment demo

1. After Step 3 (rent deposited), switch to Investor 1
2. Load Property #1 — "Claim Dividends" section shows pending dividends
3. Below the Claim button: DRIP preview appears → "Your X ETH would buy Y shares"
4. Click **Reinvest → Y shares** → confirm MetaMask
5. Investor's share count increases, ETH stays in contract

---

### Step 9 — Phase 3: Secondary Market demo

1. Switch to Investor 1 (owns shares)
2. Click **Secondary Market** tab in navigation
3. Go to **Sell Shares** tab → enter Property ID `1`, e.g. `50` shares, price `0.12` ETH
4. Click **Approve & List Shares** → MetaMask prompts approval then listing (2 txs)
5. Switch to Investor 2 → go to Secondary Market → **Browse** tab
6. See Investor 1's listing — click **Buy** → confirm MetaMask
7. Investor 2 now owns those 50 shares at the custom price

---

### Step 10 — Phase 3: Property Sale / Exit demo

1. Switch to Admin → load Property #1
2. Admin Panel → "Initiate Property Sale" (red collapsible)
3. Enter sale price e.g. `120` ETH → click **Confirm Property Sale** → confirm dialog → MetaMask
4. Property dashboard shows **SOLD** badge + sale proceeds banner
5. Switch to Investor 1 → load Property #1
6. "Buy Shares" section replaced by "Claim Sale Proceeds" showing exact payout
7. Click **Redeem Shares for Sale Proceeds** → shares burned, ETH transferred

---

## Troubleshooting

### "No contract found at address"
The Hardhat node was restarted and contracts were lost.
```bash
npm run deploy
```
Update all three addresses (`TOKEN_IT`, `PROPERTY_NFT`, `MARKETPLACE`) in `frontend/src/contracts/config.js`.

### Secondary Market tab shows "Marketplace not deployed"
The `MARKETPLACE` address in `config.js` is still the zero address placeholder. Run `npm run deploy` and copy the Marketplace address into `config.js`.

### "Nonce too high" / transaction fails in MetaMask
MetaMask cached old nonce from a previous session.
- MetaMask → Settings → Advanced → **Clear activity tab data**
- Or reset the account for the Hardhat network

### Teammates get a blank page / spinner on ngrok
ngrok free tier shows an interstitial warning page on first visit. Teammates must click **Visit Site** once. After that it works normally.

### MetaMask shows wrong balance / old data
Switch away from Hardhat network and back. Or:
- MetaMask → Settings → Advanced → **Clear activity tab data**

### "Property doesn't load" after entering ID
- Check that the Hardhat node is still running (Terminal 1)
- Check that contracts are deployed (Terminal 2)
- Verify the contract address in `config.js` matches what was printed during deploy
- Check browser console (F12) for specific error

### ngrok tunnel disconnected
Restart the ngrok command. You will get a new URL — update `config.js` and send teammates the new frontend URL.

### Can't buy more than a certain amount of shares
- Anti-whale limit: cannot buy more than 50% of available shares in one transaction
- Max purchase limit set during property creation
- Split into multiple transactions if needed

### "Approve Marketplace to transfer your shares first" when listing
The Marketplace listing flow handles approval automatically — click "Approve & List Shares" and approve **both** MetaMask transactions (first is ERC20 approval, second is the listing).

### Can't buy shares after property sale was initiated
This is expected. Once admin initiates a property sale, `fractionalized` is set to false. Use "Claim Sale Proceeds" instead to redeem your shares.

### DRIP reinvest button doesn't appear
DRIP only shows when you have both shares AND pending dividends AND the dividend amount is large enough to purchase at least one share (dividends ≥ share price). Deposit more rent to trigger it.
