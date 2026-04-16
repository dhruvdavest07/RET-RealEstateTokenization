# TokenIT — Backend Demo & Explanation Guide

> **Purpose**: This file teaches you what's happening "under the hood" so you can demo the project from the terminal (no frontend) and answer viva questions confidently. Read this top-to-bottom **once**, then keep it open during the viva.

---

## Table of Contents
1. [What is the "Backend" Here?](#1-what-is-the-backend-here)
2. [The 4 Smart Contracts (Plain English)](#2-the-4-smart-contracts-plain-english)
3. [Setup Before Demo](#3-setup-before-demo)
4. [Demo Method A — Use a Script (Easiest)](#4-demo-method-a--use-a-script-easiest)
5. [Demo Method B — Hardhat Console (Live, Impressive)](#5-demo-method-b--hardhat-console-live-impressive)
6. [Reading State From the Blockchain](#6-reading-state-from-the-blockchain)
7. [Watching Events (Proof Things Happened)](#7-watching-events-proof-things-happened)
8. [Likely Viva Questions + Answers](#8-likely-viva-questions--answers)
9. [Cheat Sheet — Commands to Memorize](#9-cheat-sheet--commands-to-memorize)

---

## 1. What is the "Backend" Here?

Most web apps have a backend = a server (Node.js, Django, etc.) + a database (MySQL, MongoDB).

**This project has NO traditional server and NO database.** The "backend" is **smart contracts** running on a **local Ethereum blockchain** (Hardhat).

| Traditional App | This Project |
|-----------------|--------------|
| Express server | Smart contracts (Solidity) |
| MySQL database | Blockchain storage (every variable in a contract) |
| REST API (`POST /buy`) | Contract function (`buyShares()`) |
| `npm start` | `npm run node` (starts blockchain) |

When the professor asks "show me the backend," show them:
- The **Hardhat node terminal** (the blockchain itself, with mining logs)
- **Calls to contract functions** from the Hardhat console or a script
- **State changes** on the blockchain (balances, mappings, structs)
- **Events** emitted by the contracts (the blockchain's "logs")

---

## 2. The 4 Smart Contracts (Plain English)

All in `contracts/` folder.

### A. `PropertyNFT.sol`
- **What**: An ERC721 NFT contract. Every physical property = 1 NFT.
- **Why NFT?** Because each property is unique — it represents *the* property itself. Think of it like a digital deed/title.
- **Key functions**: `mintProperty(location)` → mints NFT #1, #2, etc. Owned by TokenIT.

### B. `PropertyShares.sol`
- **What**: An ERC20 token. **One ERC20 contract is deployed PER property.**
- **Why ERC20?** ERC20 represents fungible (interchangeable) tokens. Each share of a property is identical — like company stock. So if Property #1 has 1000 shares, you deploy a new ERC20 with `totalSupply = 1000`.
- **Special functions** (only TokenIT can call):
  - `transferOnBehalf(from, to, amount)` — moves shares without needing investor's prior approval
  - `burnShares(from, amount)` — destroys shares (used when investor cashes out after a property sale)

### C. `TokenIT.sol` — **THE MAIN CONTRACT**
This is what coordinates everything. The `Property` struct stored here is the heart of the system:

```solidity
struct Property {
    uint256 propertyId;          // 1, 2, 3...
    uint256 nftTokenId;          // links to PropertyNFT
    address shareToken;          // address of this property's ERC20
    uint256 totalShares;         // e.g. 1000
    uint256 rentPool;            // ETH from rent, split among investors
    uint256 shareSaleProceeds;   // ETH from share sales, admin can withdraw
    bool fractionalized;         // true once shares exist
    uint256 sharePrice;          // value / totalShares
    uint256 minPurchaseAmount;   // anti-spam minimum
    uint256 maxPurchaseAmount;   // anti-whale per-tx cap
    bool sold;                   // Phase 3 — admin sold the building
    uint256 saleProceeds;        // Phase 3 — ETH from the sale, split among investors
}
```

**Main functions** (you'll call these in the demo):
- `registerAndFractionalizeProperty(location, value, totalShares, min, max)` — admin creates a property, mints NFT, deploys an ERC20
- `buyShares(propertyId, amount)` — investor pays ETH, gets shares
- `depositRent(propertyId)` — admin sends ETH that becomes the rent pool
- `claimDividends(propertyId)` — investor's payout = `(theirShares / totalShares) × rentPool`
- `transferShares(propertyId, to, amount)` — investor sends shares to someone else
- `withdrawShareSaleProceeds(propertyId, amount)` — admin withdraws ETH from share sales
- **Phase 2**: `updatePropertyValue`, `setWhitelistEnabled`, `addToWhitelist`, `reinvestDividends` (DRIP)
- **Phase 3**: `initiatePropertySale` (admin sells building), `claimSaleProceeds` (investor cashes out + shares get burned)

### D. `Marketplace.sol` (Phase 3)
- **What**: A peer-to-peer secondary market — investors can sell their shares to other investors at custom prices (not back to TokenIT).
- **Key functions**:
  - `createListing(propertyId, shares, pricePerShare)` — list shares for sale
  - `buyListing(listingId)` — buyer pays, ETH goes directly to seller, shares transfer atomically
  - `cancelListing(listingId)` — seller backs out

### Money Flow (memorize this — it's a top viva question)

1. Admin creates property → ERC20 deployed, sharePrice = value / totalShares
2. Investor buys shares → **ETH goes into `shareSaleProceeds`** (admin can withdraw later)
3. Admin deposits rent → **ETH goes into `rentPool`** (investors split this)
4. Investor claims dividends → `(shares / totalShares) × rentPool`, claimed amount tracked in `claimedDividends` mapping (no double-claim)
5. (Optional) Investor uses DRIP → dividends converted to more shares; ETH stays as `shareSaleProceeds`
6. (Optional) Property sold → `sold = true`, `saleProceeds` filled with ETH from sale
7. (Optional) Investor redeems → `(shares / totalShares) × saleProceeds`, **shares burned**
8. Marketplace flow is independent — peer-to-peer, no ETH touches TokenIT

---

## 3. Setup Before Demo

You need **3 terminals open in VS Code**.

### Terminal 1 — Start Blockchain (LEAVE OPEN)
```bash
npm run node
```
Shows 20 test accounts with private keys + "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/". **Do NOT close this terminal during the demo** — closing it wipes everything.

When you call a contract function, you'll see logs scroll here like:
```
eth_sendTransaction
  Contract call:       TokenIT#buyShares
  Transaction:         0xabc...
  From:                0x7099...
  To:                  0xe7f1...
  Value:               10 ETH
  Gas used:            145823 of 30000000
  Block #2:            0x...
```
**This is your proof that the call hit the blockchain — point at this during demo.**

### Terminal 2 — Deploy Contracts
```bash
npm run deploy
```
You will see:
```
✅ PropertyNFT deployed to:  0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ TokenIT deployed to:      0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ Marketplace deployed to:  0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

> **Important**: Update `frontend/src/contracts/config.js` with the **MARKETPLACE** address printed (the first two stay the same on a fresh node).

### Terminal 3 — This is for your demo (script or console)

---

## 4. Demo Method A — Use a Script (Easiest)

This is the safest way for a viva. Everything is pre-written and just runs.

### A.1 — Run the existing demo setup script
```bash
npx hardhat run scripts/setup-demo.js --network localhost
```

This script:
1. Connects to deployed TokenIT
2. Creates Property #1 (Luxury Apartment NYC, 100 ETH value, 1000 shares)
3. Creates Property #2 (Office Building Chicago, 250 ETH value, 2500 shares)
4. Investor 1 buys 100 shares of Property #1 (pays 10 ETH)
5. Investor 2 buys 150 shares of Property #1 (pays 15 ETH)
6. Admin deposits 10 ETH rent into Property #1
7. Prints final state

**During the demo, narrate what each step does** by referencing the file: `scripts/setup-demo.js`.

### A.2 — Run a custom one-off action (template)

Create a file `scripts/demo-claim.js`:
```js
const hre = require("hardhat");
async function main() {
  const { ethers } = hre;
  const [admin, investor1] = await ethers.getSigners();
  const tokenIT = await ethers.getContractAt(
    "TokenIT",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  );

  // Connect as Investor 1
  const asInvestor1 = tokenIT.connect(investor1);

  // Check pending dividends
  const pending = await tokenIT.calculatePendingDividends(1, investor1.address);
  console.log("Pending dividends:", ethers.utils.formatEther(pending), "ETH");

  // Claim them
  const tx = await asInvestor1.claimDividends(1);
  const receipt = await tx.wait();
  console.log("Claimed! Tx hash:", receipt.transactionHash);
  console.log("Gas used:", receipt.gasUsed.toString());
}
main().catch(console.error);
```
Run with: `npx hardhat run scripts/demo-claim.js --network localhost`

---

## 5. Demo Method B — Hardhat Console (Live, Impressive)

This is **the most impressive** way — you type commands live and the professor sees them execute on the blockchain in real-time.

### Start the console
```bash
npx hardhat console --network localhost
```

You now have a JavaScript REPL connected to your blockchain. Anything you type runs against the live local chain.

> ⚠️ **CRITICAL PASTE RULE** — the Hardhat console is a REPL that executes **every time you press Enter**. If you paste a multi-line statement line-by-line, Node interprets each line separately and throws `Uncaught SyntaxError: Unexpected token ')'` because it sees an unfinished call.
>
> **Two ways to avoid this:**
> 1. **Select an entire code block and paste it in one shot** (most terminals handle this fine — the REPL detects the multi-line input)
> 2. **Use the single-line versions below** — every statement fits on one line so you can paste or type them one at a time safely

### B.1 — Connect to deployed contracts

```js
const [admin, investor1, investor2, investor3] = await ethers.getSigners();
console.log("Admin:", admin.address);
console.log("Investor 1:", investor1.address);
const tokenIT = await ethers.getContractAt("TokenIT", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
const propertyNFT = await ethers.getContractAt("PropertyNFT", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
```

### B.2 — Create a property (as admin)

Arguments: location, value (ETH), total shares, min purchase, max purchase.

```js
const tx = await tokenIT["registerAndFractionalizeProperty(string,uint256,uint256,uint256,uint256)"]("789 Demo Street, Mumbai", ethers.utils.parseEther("100"), 1000, 10, 200);
await tx.wait();
console.log("Property created! Tx hash:", tx.hash);
```

**What just happened (narrate this to the professor):**
1. The `registerAndFractionalizeProperty` function ran on the TokenIT contract
2. Internally it minted an NFT (PropertyNFT)
3. It deployed a brand-new ERC20 contract (PropertyShares) for this property's shares
4. It stored a `Property` struct in the `properties` mapping with `propertyId = 1`
5. It calculated `sharePrice = 100 / 1000 = 0.1 ETH`
6. It emitted a `PropertyFractionalized` event

### B.3 — Read the property back from the chain
```js
const prop = await tokenIT.getProperty(1);
console.log("Property ID:    ", prop.propertyId.toString());
console.log("NFT Token ID:   ", prop.nftTokenId.toString());
console.log("Share Token:    ", prop.shareToken);
console.log("Total Shares:   ", prop.totalShares.toString());
console.log("Share Price:    ", ethers.utils.formatEther(prop.sharePrice), "ETH");
console.log("Fractionalized: ", prop.fractionalized);
console.log("Sold:           ", prop.sold);
```

**Important point to make**: This data is **not from a database** — it's read directly from blockchain storage. Anyone in the world running an Ethereum node could read the same data.

### B.4 — Investor buys shares
```js
const asInvestor1 = tokenIT.connect(investor1);
const buyTx = await asInvestor1.buyShares(1, 100, { value: ethers.utils.parseEther("10") });
const receipt = await buyTx.wait();
console.log("Bought! Gas used:", receipt.gasUsed.toString());
```
- Line 1: re-connects TokenIT with Investor 1 as `msg.sender`
- Line 2: buys 100 shares, sends 100 × 0.1 = 10 ETH
- Line 3: waits for the block to be mined

### B.5 — Verify Investor 1 actually owns the shares
This is the "wow" moment — show that the ERC20 contract knows the balance.

```js
// Get this property's ERC20 contract
const shareTokenAddr = (await tokenIT.getProperty(1)).shareToken;
const shareToken = await ethers.getContractAt("PropertyShares", shareTokenAddr);

// Check balance
const balance = await shareToken.balanceOf(investor1.address);
console.log("Investor 1 owns:", balance.toString(), "shares");
// → 100

// Check total supply
const total = await shareToken.totalSupply();
console.log("Total supply:", total.toString());
// → 1000
```

### B.6 — Show ETH actually moved
```js
const proceeds = await tokenIT.getShareSaleProceeds(1);
console.log("Share sale proceeds collected:", ethers.utils.formatEther(proceeds), "ETH");
// → 10 ETH (Investor 1's payment is sitting in the contract)

const investor1Bal = await ethers.provider.getBalance(investor1.address);
console.log("Investor 1 ETH balance:", ethers.utils.formatEther(investor1Bal), "ETH");
// → ~9990 ETH (started with 10000, paid 10 + tiny gas)
```

### B.7 — Admin deposits rent
```js
const rentTx = await tokenIT.depositRent(1, { value: ethers.utils.parseEther("10") });
await rentTx.wait();
const propAfter = await tokenIT.getProperty(1);
console.log("Rent pool now:", ethers.utils.formatEther(propAfter.rentPool), "ETH");
// → 10 ETH
```

### B.8 — Investor claims dividends
```js
// Check what they're owed
const pending = await tokenIT.calculatePendingDividends(1, investor1.address);
console.log("Pending dividends:", ethers.utils.formatEther(pending), "ETH");
// → (100 / 1000) × 10 = 1 ETH

// Claim
const claimTx = await asInvestor1.claimDividends(1);
await claimTx.wait();

// Now they should be paid
const investor1BalAfter = await ethers.provider.getBalance(investor1.address);
console.log("Investor 1 balance after claim:", ethers.utils.formatEther(investor1BalAfter), "ETH");
// → ~9991 ETH (got their 1 ETH dividend)

// And calling again pays nothing (no double-claim)
const pendingAgain = await tokenIT.calculatePendingDividends(1, investor1.address);
console.log("Pending after claim:", ethers.utils.formatEther(pendingAgain), "ETH");
// → 0
```

### B.9 — Exit the console
```js
.exit
```
Or press `Ctrl+C` twice.

---

## 6. Reading State From the Blockchain

Solidity public variables get free getter functions. You can read everything without writing a single line of new code.

```js
// Counters
await tokenIT.propertyCounter();     // how many properties exist

// Owner
await tokenIT.owner();               // admin address

// Whitelist state
await tokenIT.whitelistEnabled();    // bool
await tokenIT.whitelisted(investor1.address); // bool

// A property struct
await tokenIT.getProperty(1);

// A specific share balance
await shareToken.balanceOf(investor1.address);

// How much they've already claimed (prevents double-claim)
await tokenIT.claimedDividends(1, investor1.address);

// How much they could claim right now
await tokenIT.calculatePendingDividends(1, investor1.address);

// How much ETH the contract holds
await ethers.provider.getBalance(tokenIT.address);
```

---

## 7. Watching Events (Proof Things Happened)

Events are the blockchain's permanent log. Every action you see in the UI was originally an event the contract emitted.

### After any transaction, parse events from its receipt:
```js
const tx = await tokenIT.depositRent(1, { value: ethers.utils.parseEther("5") });
const receipt = await tx.wait();
console.log("Events emitted:");
(receipt.events || []).filter(e => e.event).forEach(e => console.log(`  ${e.event}:`, e.args));
```

You'll see something like:
```
Events emitted:
  RentDeposited: [BigNumber(1), '0xf39F...', BigNumber('5000000000000000000'), BigNumber('5000000000000000000'), propertyId: ..., depositor: ..., amount: ..., newRentPool: ...]
```

### Query past events (audit trail)
```js
const filter = tokenIT.filters.SharesPurchased();
const events = await tokenIT.queryFilter(filter);
events.forEach(e => console.log(`Property #${e.args.propertyId}: ${e.args.buyer} bought ${e.args.amount} shares for ${ethers.utils.formatEther(e.args.cost)} ETH`));
```

**This is huge for the viva** — show that you can reconstruct the entire history of the platform from on-chain events. No database needed.

---

## 8. Likely Viva Questions + Answers

### Q1. "Where is your data stored?"
**A**: On the blockchain itself. Every variable in the contracts (`properties` mapping, balances, counters, whitelist) lives in blockchain storage. There is no MySQL/MongoDB. The Hardhat node holds all state in memory while it runs; in production, this would be Ethereum mainnet or a Layer-2.

### Q2. "What's the difference between PropertyNFT and PropertyShares?"
**A**: PropertyNFT is **ERC721** — non-fungible, one NFT per property, represents the deed/title. PropertyShares is **ERC20** — fungible, one ERC20 contract per property, represents the divided ownership stakes. So Property #1 has *one* NFT but *one thousand* shares.

### Q3. "Why do you need a separate ERC20 per property?"
**A**: Because each property has its own shareholders, its own total supply, its own rent pool. If we used one shared token, we couldn't distinguish "100 shares of property A" from "100 shares of property B." Deploying a new ERC20 contract per property gives each property an isolated, standards-compliant share token that wallets like MetaMask can natively recognize.

### Q4. "How do dividends work mathematically?"
**A**: When an admin deposits rent, ETH goes into `rentPool[propertyId]`. When investor X claims, they get `(shareToken.balanceOf(X) / totalShares) × rentPool - alreadyClaimed`. The `claimedDividends` mapping tracks how much each investor has already claimed so they can never double-claim.

### Q5. "How do you prevent reentrancy?"
**A**: We follow the **Checks-Effects-Interactions (CEI) pattern**. In `claimDividends`, `claimSaleProceeds`, `reinvestDividends`, and `Marketplace.buyListing`: we update state (e.g., set `claimedDividends`, deactivate listings) **before** transferring ETH or making external calls. This way, even if a reentrant call comes back in, the state already reflects that the action completed.

### Q6. "What's the anti-whale rule?"
**A**: Inside `buyShares`, we check `amount <= availableShares / 2`. So no single buy transaction can grab more than 50% of remaining shares. This prevents a single rich buyer from monopolizing a property in one shot.

### Q7. "Why use `transferOnBehalf` instead of standard ERC20 transferFrom?"
**A**: Standard ERC20 `transferFrom` requires the user to first call `approve()` to give the spender (TokenIT) permission. That's a UX problem — investors would need 2 MetaMask transactions for every transfer. So we added `transferOnBehalf` to PropertyShares, gated to only the TokenIT contract. TokenIT *is* the share token's deployer/parent, so this is safe — TokenIT can move any user's shares but only via well-defined business logic in TokenIT (transferShares, claimSaleProceeds-burn, etc.).

### Q8. "Marketplace doesn't use transferOnBehalf — why?"
**A**: Because Marketplace is a separate contract that wasn't trusted by PropertyShares the same way TokenIT is. So Marketplace uses standard ERC20 `approve` + `transferFrom`. Listing requires 2 MetaMask transactions (approve, then list), which is acceptable because it's a deliberate seller action.

### Q9. "What is DRIP?"
**A**: Dividend Reinvestment Plan. Instead of withdrawing the dividend ETH, the investor calls `reinvestDividends(propertyId)`. The function calculates how many additional shares their pending dividends can buy at current `sharePrice`, mints those shares to them, and credits the ETH back to `shareSaleProceeds` (so admin can withdraw it later). Powerful because the investor compounds their position without ever touching ETH.

### Q10. "What happens during a property sale?"
**A**: `initiatePropertySale(propertyId)` is admin-only and `payable` — the admin sends the sale ETH along with the call. We set `sold = true`, `fractionalized = false`, and store the ETH in `saleProceeds`. After this, `buyShares` is blocked. Each investor calls `claimSaleProceeds(propertyId)` — they get `(theirShares / totalShares) × saleProceeds` and their shares are **burned** via PropertyShares.burnShares (so no one is left holding worthless shares of a sold building).

### Q11. "What's stored on-chain vs off-chain?"
**A**: On-chain: property struct (location string, value, shares, pools), share balances, NFT ownership, KYC whitelist, every transaction event. Off-chain: nothing critical — the React frontend is just a viewer/UI; deleting it would not lose any data.

### Q12. "Why Hardhat? Why local?"
**A**: For development and demo. Hardhat is a local Ethereum simulator — instant transactions, free gas, 20 pre-funded test accounts, no need for testnet ETH. The exact same Solidity code would deploy to Ethereum mainnet, Polygon, or any EVM chain in production with no changes.

### Q13. "What is OpenZeppelin?"
**A**: A library of audited, battle-tested Solidity contracts. We use their ERC721 and ERC20 base implementations rather than writing our own — this is industry best practice because rolling your own token contract is the #1 source of historical exploits.

### Q14. "Show me where the actual logic lives."
- `contracts/TokenIT.sol` — main business logic (~400 lines)
- `contracts/PropertyShares.sol` — ERC20 with custom transferOnBehalf/burnShares
- `contracts/PropertyNFT.sol` — simple ERC721 wrapper
- `contracts/Marketplace.sol` — secondary market

### Q15. "How does the frontend talk to the blockchain?"
**A**: Through **ethers.js** (a JavaScript library). It speaks JSON-RPC to the Hardhat node at `http://127.0.0.1:8545`. MetaMask injects a Web3 provider into the browser; the React hooks (`useWeb3`, `useProperty`, `useMarketplace`) wrap ethers.js to call contract functions and listen for events. **The frontend has zero business logic** — it's a thin shell over the contracts.

---

## 9. Cheat Sheet — Commands to Memorize

### Start the project
```bash
# Terminal 1 — leave open
npm run node

# Terminal 2
npm run deploy
# (paste MARKETPLACE address into frontend/src/contracts/config.js)

# Terminal 3 — pick ONE for the demo:
# (a) Run pre-built setup
npx hardhat run scripts/setup-demo.js --network localhost
# (b) Open live console
npx hardhat console --network localhost
```

### Inside Hardhat console — minimum viable demo

Every line is a complete statement — safe to paste or type one at a time.

```js
const [admin, investor1, investor2] = await ethers.getSigners();
const tokenIT = await ethers.getContractAt("TokenIT", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
await (await tokenIT["registerAndFractionalizeProperty(string,uint256,uint256,uint256,uint256)"]("Demo Street", ethers.utils.parseEther("100"), 1000, 10, 200)).wait();
const asInv1 = tokenIT.connect(investor1);
await (await asInv1.buyShares(1, 100, { value: ethers.utils.parseEther("10") })).wait();
await (await tokenIT.depositRent(1, { value: ethers.utils.parseEther("10") })).wait();
await (await asInv1.claimDividends(1)).wait();
const p = await tokenIT.getProperty(1);
console.log("Rent pool:", ethers.utils.formatEther(p.rentPool));
console.log("Sale proceeds:", ethers.utils.formatEther(p.shareSaleProceeds));
const shareToken = await ethers.getContractAt("PropertyShares", p.shareToken);
console.log("Investor 1 shares:", (await shareToken.balanceOf(investor1.address)).toString());
console.log("Investor 1 ETH:", ethers.utils.formatEther(await ethers.provider.getBalance(investor1.address)));
```

What each line does:
1–2. Connect to accounts + deployed TokenIT contract
3. Create property (registers NFT, deploys ERC20)
4–5. Investor 1 buys 100 shares for 10 ETH
6. Admin deposits 10 ETH rent
7. Investor 1 claims dividends
8–13. Print final state — rent pool, sale proceeds, investor shares, investor ETH

### Useful contract addresses (fresh deploy on a clean node)
```
PropertyNFT: 0x5FbDB2315678afecb367f032d93F642f64180aa3
TokenIT:     0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Marketplace: <varies — copy from npm run deploy output>
```

### Test accounts
| Role       | Address                                      |
|------------|----------------------------------------------|
| Admin      | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Investor 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| Investor 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| Investor 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |

---

## Final Tip — Demo Flow Suggestion (5 mins)

1. Open Terminal 1 — show `npm run node` running, point to "Started JSON-RPC server" → "this is the blockchain"
2. Open `contracts/TokenIT.sol` in VS Code, scroll the `Property` struct + `buyShares` function → "this is the business logic, written in Solidity, compiled to EVM bytecode"
3. Open Terminal 3, run `npx hardhat console --network localhost`
4. Paste the **minimum viable demo** block from Section 9
5. After each call, show the **mining log scroll in Terminal 1** as proof
6. Read final state with `tokenIT.getProperty(1)` → show the struct printed with all values
7. Open frontend in browser → "and this is the UI on top of all that — but everything you just saw happened on the blockchain, not the UI"

Done. You've shown contracts, console interaction, state reads, ETH movement, and the frontend connection in 5 minutes.
