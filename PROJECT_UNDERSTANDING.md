# TokenIT — Project Understanding Document

This document serves as a complete reference for evaluation preparation, PPT sections, and the course lecture checklist. Everything is answered specifically in context of this project's actual code.

---

## Table of Contents

1. [Blockchain Internals — Evaluation (10%)](#1-blockchain-internals--evaluation-10)
2. [Smart Contract Coding — Evaluation (30%)](#2-smart-contract-coding--evaluation-30)
3. [Viva-Voce Preparation — Evaluation (20%)](#3-viva-voce-preparation--evaluation-20)
4. [PPT Section 5.3 — Smart Contracts & Stakeholders](#4-ppt-section-53--smart-contracts--stakeholders)
5. [PPT Section 5.4 — Blockchain Structure](#5-ppt-section-54--blockchain-structure)
6. [PPT Section 5.5 — Off-chain / Database Schema](#6-ppt-section-55--off-chain--database-schema)
7. [PPT Section 6 — Implementation](#7-ppt-section-6--implementation)
8. [Course Lecture Checklist](#8-course-lecture-checklist)

---

## 1. Blockchain Internals — Evaluation (10%)

### Why Does This Project Need a Blockchain?

TokenIT satisfies all three core blockchain requirements:

| Requirement | How TokenIT Uses It |
|-------------|-------------------|
| **Decentralization** | Share ownership is recorded on-chain — no single company database can be altered or shut down |
| **Immutability** | Every share purchase, rent deposit, and dividend claim is a permanent, auditable transaction |
| **Trustless coordination** | Investors and admin never need to trust each other — smart contracts enforce all rules automatically |

A traditional database would require trusting the platform operator. A blockchain eliminates that trust requirement entirely.

### On-Chain vs. Off-Chain in TokenIT

**On-chain (in smart contracts):**
- Property registration and fractionalization
- Share ownership (ERC20 balances)
- Share purchases (ETH transfers)
- Rent pool balances
- Dividend entitlement calculations and claims
- Share sale proceeds tracking
- Admin access control
- All business rules (min/max purchase, 50% anti-whale)

**Off-chain (currently not implemented, future scope):**
- Property photographs and images
- Legal documents (deed, lease agreement, valuation report)
- KYC/identity verification data
- Price history charts (indexed from events)
- Investor portfolio analytics

**The rule applied:** Only state that requires consensus, auditability, and trustless coordination is on-chain. Files, metadata, and analytics belong off-chain (IPFS for files, a Graph indexer for analytics).

### Consensus Algorithm

TokenIT runs on a **Hardhat local development network**. Hardhat uses **instant mining** (automining) — every transaction is mined immediately into its own block. This is for development/demo only.

On production Ethereum (if deployed to mainnet or testnet):
- **Consensus**: Ethereum uses **Proof of Stake (PoS)** since The Merge (September 2022)
- **Finality**: Transactions achieve probabilistic finality after ~12 seconds (1 slot), economic finality after ~15 minutes (2 epochs)
- **Validators**: 32 ETH stake required to become a validator; validators propose and attest blocks
- **Block time**: ~12 seconds on Ethereum mainnet

For our demo network (Hardhat):
- Chain ID: `31337`
- RPC: `http://127.0.0.1:8545`
- Mining: Instant (every tx mines a new block)
- 20 pre-funded accounts with 10,000 ETH each

### Ethereum Virtual Machine (EVM)

All three contracts compile to **EVM bytecode** and run on the EVM:
- The EVM is a **stack-based** virtual machine
- Every operation costs **gas** (computational units)
- Gas is paid in ETH by the transaction sender
- Storage writes (`SSTORE`) are the most expensive operation (~20,000 gas for new slot)
- The EVM is **deterministic** — same input always produces same output, on every node

---

## 2. Smart Contract Coding — Evaluation (30%)

### The Three Contracts

#### `TokenIT.sol` — Main Platform Contract

**Purpose**: The orchestrator. Manages all property logic, share sales, rent pools, dividend distribution, and proceeds.

**Key state variables:**
```solidity
mapping(uint256 => Property) public properties;
mapping(uint256 => mapping(address => uint256)) public claimedDividends;
uint256 public propertyCounter;
address public owner;
```

**Key functions and their logic:**

| Function | Access | What it does |
|----------|--------|-------------|
| `registerAndFractionalizeProperty` | `onlyOwner` | Creates property, deploys new ERC20 share token, sets share price = value / totalShares |
| `buyShares` | public, `payable` | Validates min/max/50% limits, transfers shares, tracks proceeds, refunds excess ETH |
| `depositRent` | public, `payable` | Adds ETH to rentPool for a property |
| `claimDividends` | public | Calculates entitlement = (shares/totalShares) × rentPool, pays claimable = entitlement − alreadyClaimed |
| `withdrawShareSaleProceeds` | `onlyOwner` | Withdraws ETH from shareSaleProceeds to owner wallet |
| `transferShares` | public | Wraps ERC20 `transferFrom` for convenience |
| `getPendingDividends` | view | Read-only entitlement calculation |
| `getInvestorInfo` | view | Returns shares, ownership %, pending dividends in one call |

**Dividend calculation — how it works:**

The contract uses a **cumulative entitlement** model:
```
totalEntitlement = (sharesOwned × rentPool) / totalShares
claimable = totalEntitlement - alreadyClaimed[propertyId][investor]
```

When rent is deposited again, `rentPool` grows, so `totalEntitlement` grows, and the investor can claim the delta. This avoids iterating over all investors.

**Edge cases handled:**
- `amount = 0` → `require(amount > 0)` in buyShares and transferShares
- Excess ETH sent → refunded: `if (msg.value > cost) payable(msg.sender).transfer(msg.value - cost)`
- No dividends to claim → `require(totalEntitlement > alreadyClaimed)`
- Buying all shares → 50% anti-whale: `require(amount <= (availableShares * 50) / 100)`
- Invalid purchase limits → `require(minPurchase <= maxPurchase || maxPurchase == 0)`
- Zero address transfer → `require(to != address(0))`
- Zero share price → `require(sharePrice > 0)` after division

---

#### `PropertyNFT.sol` — ERC721 Property NFT

**Purpose**: Represents each physical property as a unique NFT. Extends OpenZeppelin's `ERC721` and `Ownable`.

**Key design:**
- Each property gets one NFT (`tokenId`)
- Bidirectional lookup: `propertyId → tokenData` and `tokenId → propertyId`
- Minted to the admin (owner) wallet at registration

**Why an NFT for the property?**
- Provides a unique, non-fungible identifier for the real-world asset
- The NFT can later carry IPFS metadata (photos, deed hash)
- Separates the *property identity* (NFT) from *fractional ownership* (ERC20 shares)

---

#### `PropertyShares.sol` — ERC20 Share Token

**Purpose**: Represents fractional ownership of one specific property. One deployment per property, done by `TokenIT` at registration time.

**Key design:**
- `immutable` variables for `tokenIT` address, `propertyId`, `totalShares` — set once in constructor, cannot change
- All shares minted to `TokenIT` contract at creation; distributed to investors via `transfer`
- `getAvailableShares()` = `balanceOf(tokenIT)` — shares still unsold
- Overrides `transfer` and `transferFrom` to emit a custom `SharesTransferred` event
- No mint/burn functions — supply is fixed forever

---

### Security Patterns Applied

| Pattern | Where Used |
|---------|-----------|
| **Checks-Effects-Interactions (CEI)** | `claimDividends`: checks first (require), then updates state (`claimedDividends`), then transfers ETH |
| **Solidity 0.8+ overflow protection** | All arithmetic automatically reverts on overflow/underflow |
| **OpenZeppelin audited libraries** | ERC721 (PropertyNFT), ERC20 (PropertyShares), Ownable (PropertyNFT) |
| **Access control modifiers** | `onlyOwner`, `propertyExists`, `isFractionalized` applied consistently |
| **Zero address checks** | Constructor and transfer functions |
| **ETH refund on overpayment** | `buyShares` refunds `msg.value - cost` |

**Known limitations (honest assessment for viva):**
- No `ReentrancyGuard` — mitigated by using `.transfer()` (2300 gas limit) but best practice is to use the guard
- Single-owner admin (no multi-sig) — centralization risk
- Not upgradeable (no proxy pattern) — bugs cannot be patched without redeployment and data migration
- `_registerAndFractionalizeProperty` has redundant `onlyOwner` on internal function

### Gas Optimization Applied

- `immutable` in `PropertyShares` for `tokenIT`, `propertyId`, `totalShares` — saves 2,100 gas per read vs storage
- Mapping-based storage (`properties`, `claimedDividends`) avoids unbounded loops
- `_uintToString` is internal pure — no storage access
- Return multiple values from `getInvestorInfo` in one call — saves three separate RPC calls on frontend

---

## 3. Viva-Voce Preparation — Evaluation (20%)

**Q: Why not use a traditional database for this?**
A: A database requires trusting the operator. With a smart contract, the rules (dividend formula, purchase limits) are public, immutable, and self-enforcing. No investor needs to trust the admin to calculate their dividend correctly — they can read the contract code.

**Q: What is the dividend calculation and why does it work even after multiple rent deposits?**
A: The contract tracks `claimedDividends[propertyId][investor]` as a cumulative total. Each time rent is deposited, the total entitlement grows. When an investor claims, they receive `totalEntitlement - alreadyClaimed`. This means each investor can claim after each rent deposit independently, without any global reset.

**Q: What prevents a whale from buying all shares?**
A: Two mechanisms: (1) Admin sets `maxPurchaseAmount` per property. (2) Hard-coded 50% rule: `require(amount <= (availableShares * 50) / 100)` — you can never buy more than half of remaining shares in a single transaction.

**Q: Why deploy a new ERC20 contract for each property instead of one contract?**
A: Each property has completely independent share economics — different total supply, different price. A single ERC20 contract cannot represent multiple different share classes cleanly. Deploying separately gives each property its own token address, making them composable with wallets and DeFi.

**Q: What is the difference between `rentPool` and `shareSaleProceeds`?**
A: `rentPool` = ETH deposited by admin as rental income → distributed to investors as dividends. `shareSaleProceeds` = ETH paid by investors to buy shares → belongs to the admin (property owner) to recoup their capital. They are tracked separately to prevent mixing investor income with owner proceeds.

**Q: What happens if share price doesn't divide evenly?**
A: `sharePrice = value / totalShares` uses integer division in Solidity — fractional wei is truncated. The actual collected proceeds per full sell-out will be `sharePrice × totalShares`, which may be slightly less than `value` due to rounding. This is an accepted precision trade-off. In a production system you'd use fixed-point math libraries.

**Q: Is the contract reentrancy-safe?**
A: Partially. `claimDividends` follows CEI — state is updated before the ETH transfer. We use `.transfer()` which forwards only 2300 gas, making reentrant calls impossible with current gas costs. However, best practice is to add OpenZeppelin's `ReentrancyGuard` modifier, which we have noted as a future improvement.

**Q: Why is `PropertyShares.tokenIT` immutable?**
A: The `tokenIT` address is the address of the `TokenIT` contract that deployed this share token. It never needs to change — if it could, someone could replace it with a malicious contract and drain shares. `immutable` prevents this at the compiler level and also saves gas on reads.

**Q: What consensus does Ethereum use now?**
A: Proof of Stake since The Merge (September 2022). Validators stake 32 ETH. Blocks are proposed every 12 seconds. Our development network (Hardhat) uses instant automining — no consensus needed locally.

**Q: What is an ABI and why do you need it in the frontend?**
A: ABI (Application Binary Interface) is a JSON description of a contract's functions, parameters, and return types. Ethers.js uses it to encode function calls into EVM bytecode and decode return values. Without it, the frontend has no way to call specific contract functions.

---

## 4. PPT Section 5.3 — Smart Contracts & Stakeholders

### Contracts Summary

| Contract | Standard | Role |
|----------|----------|------|
| `TokenIT.sol` | Custom | Platform orchestrator: property registry, share distribution, rent pool, dividends |
| `PropertyNFT.sol` | ERC-721 + Ownable | Unique digital title deed for each physical property |
| `PropertyShares.sol` | ERC-20 | Fungible fractional ownership token, one deployment per property |

### Stakeholders

| Stakeholder | Address | Capabilities |
|-------------|---------|-------------|
| **Admin (Property Owner)** | `0xf39F...2266` | Register properties, deposit rent, withdraw proceeds, set purchase limits |
| **Investor** | Any wallet | Buy shares, claim dividends, transfer shares P2P |
| **TokenIT Contract** | `0xe7f1...0512` | Holds unsold shares in escrow, holds ETH (rent + proceeds) |
| **PropertyShares Contract** | Deployed per property | Tracks ERC20 balances (ownership records) |
| **PropertyNFT Contract** | `0x5FbD...aa3` | Holds NFT title deed, minted to admin |

### Stakeholder Interaction Diagram

```
Admin ──────────────────────────────────────────────────────────────────────────┐
  │ registerAndFractionalizeProperty()                                          │
  │ depositRent()                                                               │
  │ withdrawShareSaleProceeds()                                                 │
  ▼                                                                             │
TokenIT.sol ◄──── buyShares() ────── Investor                                  │
  │    │          claimDividends()                                              │
  │    │          transferShares()                                              │
  │    │                                                                        │
  │    └──── deploys ──── PropertyShares.sol (ERC20)                           │
  │                         balanceOf(investor) = shares owned                 │
  │                                                                             │
  └──── calls ──── PropertyNFT.sol (ERC721)  ◄──────────────────────────────── ┘
                    NFT minted to admin
```

---

## 5. PPT Section 5.4 — Blockchain Structure

### Block Structure (Ethereum)

Each Ethereum block contains:
```
Block Header
├── parentHash       — links to previous block (chain)
├── stateRoot        — Merkle root of all account states
├── transactionsRoot — Merkle root of transactions in this block
├── receiptsRoot     — Merkle root of transaction receipts (includes events/logs)
├── number           — block height
├── gasLimit         — max gas allowed
├── gasUsed          — actual gas consumed
└── timestamp        — Unix timestamp

Block Body
├── Transaction 1: buyShares(propertyId=1, amount=100) + 10 ETH
├── Transaction 2: claimDividends(propertyId=1)
└── ...
```

### How a TokenIT Transaction Flows Through the Blockchain

```
1. User clicks "Buy Shares" in browser
       │
2. MetaMask signs the transaction with user's private key
       │
3. Signed transaction broadcast to Hardhat node (or Ethereum network)
       │
4. Transaction enters mempool (pending pool)
       │
5. Miner/Validator picks up transaction, executes it on EVM
   ├── EVM loads TokenIT bytecode
   ├── Calls buyShares(propertyId, amount)
   ├── Validates: amount > 0, msg.value >= cost, within purchase limits
   ├── Updates state: shareToken.transfer(buyer, amount)
   ├── Updates state: property.shareSaleProceeds += cost
   └── Emits: SharesPurchased event
       │
6. State changes written to new block
       │
7. Block added to chain — transaction confirmed
       │
8. Frontend detects tx confirmation, refreshes property data
```

### Smart Contract Deployment Transaction

When `npm run deploy` runs:
1. Deployment script signs a transaction with no `to` address (contract creation)
2. EVM executes the constructor bytecode
3. Contract bytecode stored at a new address (deterministic: based on deployer address + nonce)
4. `PropertyNFT` deployed first → address used in `TokenIT` constructor
5. `TokenIT` deployed second → address saved in `config.js`

### Gas Costs (Approximate)

| Operation | Gas Used | ETH Cost (at 1 gwei) |
|-----------|----------|---------------------|
| Deploy TokenIT | ~2,000,000 | 0.002 ETH |
| registerAndFractionalizeProperty | ~800,000 | 0.0008 ETH |
| buyShares (100 shares) | ~80,000 | 0.00008 ETH |
| claimDividends | ~50,000 | 0.00005 ETH |
| depositRent | ~45,000 | 0.000045 ETH |

### Chain Linkage (Immutability)

```
Block 1          Block 2          Block 3
┌───────────┐    ┌───────────┐    ┌───────────┐
│ hash: A1B2│◄───│ parent: A1│◄───│ parent: C4│
│ txs: [...] │    │ hash: C4D5│    │ hash: E6F7│
│ state root │    │ txs: [    │    │ txs: [    │
└───────────┘    │ buyShares]│    │ claim...] │
                 └───────────┘    └───────────┘
```

Modifying any past transaction would change that block's hash, breaking every subsequent block's `parentHash` — detectable by any node.

---

## 6. PPT Section 5.5 — Off-chain / Database Schema

### Current State

TokenIT currently stores **everything on-chain**. There is no off-chain database.

**What's stored on-chain:**

| Data | Contract | Storage Type |
|------|----------|-------------|
| Property metadata (ID, shares, price) | `TokenIT.properties` | `mapping(uint256 → Property)` |
| Share balances | `PropertyShares` (ERC20) | `mapping(address → uint256)` |
| Claimed dividends | `TokenIT.claimedDividends` | `mapping(uint256 → mapping(address → uint256))` |
| NFT ownership | `PropertyNFT` (ERC721) | inherited OZ mapping |

### What Should Be Off-chain (Future)

| Data | Reason | Storage Solution |
|------|--------|-----------------|
| Property photographs | Too large for on-chain (expensive) | IPFS — store hash on-chain |
| Legal documents (deed, lease) | Privacy + size | IPFS — store hash on-chain |
| KYC/identity data | Legal requirement (GDPR) | Centralized KYC service or off-chain DB |
| Price history / charts | Derived from events — no need to store | The Graph (event indexer) |
| User notification preferences | Not security-critical | Off-chain database |

### IPFS Integration Pattern (Future)

```
Admin uploads deed PDF
        │
Pinata/IPFS service stores file
        │
Returns CID (content hash): QmXxx...
        │
Admin calls TokenIT.setPropertyDocument(propertyId, "QmXxx...")
        │
On-chain stores only the 32-byte hash
        │
Anyone can verify: fetch from IPFS using CID, hash matches
```

### Why No Traditional Database Is Needed for Core Logic

The core invariants (who owns what, who is owed what) must be on-chain for trustlessness. A database could be added as a **read cache** (faster queries, better UX) but could never replace the on-chain source of truth.

---

## 7. PPT Section 6 — Implementation

### Platform

| Layer | Technology | Version |
|-------|-----------|---------|
| Blockchain | Ethereum (Hardhat local) | Hardhat 2.x |
| Smart Contracts | Solidity | ^0.8.20 |
| Contract Libraries | OpenZeppelin | 5.x |
| Frontend | React + Vite | React 18 |
| Styling | TailwindCSS | 3.x |
| Web3 Library | Ethers.js | v5 |
| Wallet | MetaMask | Latest |

### Contract Deployment Results (Default Hardhat Addresses)

```
Deployer:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

PropertyNFT deployed to:  0x5FbDB2315678afecb367f032d93F642f64180aa3
TokenIT deployed to:      0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

These addresses are deterministic — as long as the deployer account has never made any transactions before (nonce 0), the addresses will always be the same.

### Smart Contract Execution Outputs (Sample)

#### 1. Register Property
```
Input:  location="123 Park Ave, NYC", value=100ETH, shares=1000, min=10, max=200
Output: PropertyFractionalized event
  ├── propertyId: 1
  ├── shareToken: 0xDc64...  (new ERC20 deployment)
  ├── totalShares: 1000
  └── sharePrice: 100000000000000000 (0.1 ETH in wei)
```

#### 2. Buy Shares
```
Input:  propertyId=1, amount=100, msg.value=10 ETH
Output: SharesPurchased event
  ├── propertyId: 1
  ├── buyer: 0x7099...79C8
  ├── amount: 100
  └── cost: 10000000000000000000 (10 ETH in wei)
State change: property.shareSaleProceeds += 10 ETH
```

#### 3. Deposit Rent
```
Input:  propertyId=1, msg.value=10 ETH
Output: RentDeposited event
  ├── propertyId: 1
  ├── depositor: 0xf39F...
  ├── amount: 10 ETH
  └── newRentPool: 10 ETH
```

#### 4. Claim Dividends (Investor with 100/1000 shares)
```
Calculation:
  totalEntitlement = (100 * 10 ETH) / 1000 = 1 ETH
  alreadyClaimed   = 0
  claimable        = 1 ETH

Output: DividendsClaimed event
  ├── propertyId: 1
  ├── investor: 0x7099...79C8
  └── amount: 1000000000000000000 (1 ETH in wei)
```

---

## 8. Course Lecture Checklist

Answers to every topic from *"Project Planning to Development using Blockchain Technology"* — in context of TokenIT.

---

### PLANNING

#### Do You Actually Need a Blockchain?

**Yes.** TokenIT has:
- **Multiple untrusting parties**: Admin (property owner) and investors have conflicting interests. Admin should not be able to manipulate dividend calculations.
- **Immutability requirement**: Share ownership records must be permanent and unalterable.
- **Trustless coordination**: Dividend distribution is enforced by code, not by the admin.

If TokenIT used a traditional database, the platform operator could silently change the dividend formula or balances. On-chain, this is impossible.

#### On-chain vs. Off-chain Boundary

TokenIT's on-chain boundary: all financial state (ownership, balances, dividends) and all business rules (purchase limits, anti-whale).

Off-chain (planned): property documents on IPFS (hash stored on-chain), KYC data, UI analytics.

Tokenomics: Fixed supply per property (no inflation). Share price is fixed at `value / totalShares` at creation. No staking, no reward tokens — simple equity model.

#### Blockchain Selection

TokenIT uses **Ethereum** (local Hardhat for development, Sepolia testnet for staging, mainnet or Polygon for production).

| Dimension | Our Choice | Rationale |
|-----------|-----------|-----------|
| Smart contract language | Solidity | Largest ecosystem, best tooling (Hardhat, OZ) |
| Chain | Ethereum-compatible | EVM standard, MetaMask ubiquity |
| Network (prod) | Polygon or Arbitrum | Lower gas fees for retail investors |
| Chain type | Public | Permissionless investment is the point |

#### Regulatory & Legal Assessment

**Acknowledged risks:**
- **Securities law**: Tokenized real estate shares may be classified as securities in most jurisdictions. In production, legal counsel and compliance (e.g., Regulation D or Reg A+ in the US) would be required.
- **AML/KYC**: Financial transactions require identity verification. Our KYC whitelist feature (Phase 2) addresses this.
- **GDPR**: KYC data (personal identity) must be stored off-chain (not on an immutable blockchain).

**For this university project**: Scoped to a local demo, no real value at risk. Legal compliance is acknowledged but outside project scope.

#### Team Competency

Skills applied in this project:
- Solidity + EVM gas model
- OpenZeppelin contract patterns
- Ethers.js web3 integration
- React + async state management for blockchain data
- Hardhat deployment scripts and testing framework

---

### DESIGN

#### Architecture Decisions

On-chain/off-chain boundary is defined above. All financial state on-chain. Documents and identity off-chain.

Large data policy: Property photos and legal documents are NOT stored on-chain (too expensive). IPFS hashes would be stored on-chain as `bytes32`. Files live on IPFS/Arweave.

#### Smart Contract Architecture

**Separation of concerns applied:**
- `TokenIT.sol` — business logic only (no NFT minting, no ERC20 internals)
- `PropertyNFT.sol` — property identity / NFT layer
- `PropertyShares.sol` — token economics layer

**Limitation**: No proxy/upgrade pattern. The contracts are not upgradeable. If a critical bug is found post-deployment, contracts must be redeployed and data migrated. For a university project this is acceptable; for production use, OpenZeppelin's UUPS Proxy would be required.

**Access control**: Uses simple `Ownable` pattern via `owner` state variable. For production, OpenZeppelin's `AccessControl` with role-based permissions (ADMIN_ROLE, MANAGER_ROLE) would be better.

#### Key Management & Identity Design

Current: Single EOA (Externally Owned Account) as admin. MetaMask holds the private key.

Production recommendation:
- **Multi-sig**: Gnosis Safe requiring 2-of-3 signatures for admin actions
- **Hardware wallets**: Ledger/Trezor for key holders
- **Account abstraction (ERC-4337)**: Better UX — gasless transactions, social recovery

#### Economic Security Modeling

Questions asked during design:

*What does a rational investor do?* — Buy shares at any price below their perceived yield. Claim dividends immediately when available. Could try to buy >50% of shares in one go → blocked by anti-whale rule.

*What does a malicious actor do?* — Try to manipulate dividend calculation → cannot, it's a pure formula. Try to front-run a rent deposit → could buy shares right before rent is deposited, then claim dividends → **this is a known and accepted limitation** (similar to dividend capture strategies in traditional markets). Could try reentrancy on `claimDividends` → mitigated by CEI pattern and `.transfer()` gas limit.

#### Event & Indexing Design

Events emitted for every state change:

| Event | Indexed Fields | Purpose |
|-------|---------------|---------|
| `PropertyFractionalized` | `propertyId`, `shareToken` | Track new properties |
| `SharesPurchased` | `propertyId`, `buyer` | Track investor activity |
| `RentDeposited` | `propertyId`, `depositor` | Trigger frontend refresh |
| `DividendsClaimed` | `propertyId`, `investor` | Track payouts |
| `SharesTransferred` | `propertyId`, `from`, `to` | Track P2P transfers |
| `ShareSaleProceedsWithdrawn` | `propertyId`, `admin` | Track admin withdrawals |

Frontend uses Ethers.js event listeners / polling to detect state changes. In production, The Graph would index these events for efficient historical queries.

---

### DEVELOPMENT

#### Use Audited Libraries

- `ERC721` from OpenZeppelin — industry standard, battle-tested
- `ERC20` from OpenZeppelin — industry standard
- `Ownable` from OpenZeppelin — standard admin pattern
- Custom cryptography: **zero** — we use Solidity's built-in primitives only

#### Security-First Development Practices

| Practice | Applied in TokenIT |
|---------|-------------------|
| **CEI pattern** | `claimDividends`: require → state update → ETH transfer |
| **0.8+ overflow protection** | Pragma `^0.8.20` — arithmetic reverts on overflow |
| **No `tx.origin`** | All auth uses `msg.sender` |
| **No `delegatecall`** | Not used anywhere |
| **Least privilege** | `onlyOwner` on all admin functions, `propertyExists` + `isFractionalized` on investor functions |
| **Zero address checks** | Constructor, transfer functions |

**Not yet applied (known gaps):**
- No `ReentrancyGuard` (mitigated but should be added)
- No `Pausable` (cannot pause contract in emergency)
- No input sanitization on `location` string length

#### Test Coverage

Current test files exist in the `test/` directory. 

Key test cases to demonstrate:
- ✅ Happy path: register → buy → deposit rent → claim dividends
- ✅ Edge case: buy exactly at 50% limit
- ✅ Edge case: try to buy >50% → should revert
- ✅ Edge case: claim with 0 shares → should revert
- ✅ Edge case: claim when nothing deposited → should revert
- ✅ Edge case: non-admin calls `registerAndFractionalizeProperty` → should revert
- ✅ Double claim: claim once, then claim again before new rent → should revert or return 0

#### Gas Optimization Applied

| Optimization | Where |
|-------------|-------|
| `immutable` keyword | `PropertyShares`: `tokenIT`, `propertyId`, `totalShares` |
| Mapping over arrays | `properties`, `claimedDividends` — O(1) lookup, no loops |
| Multiple return values | `getInvestorInfo` returns 3 values in one call |
| Refund excess ETH | `buyShares` returns overpayment — user never overpays |

**Not yet applied (future):**
- Pack `Property` struct fields to reduce storage slots
- Use `calldata` instead of `memory` for view function parameters
- Custom errors instead of `require` strings (saves ~50 gas per revert)

#### Multi-Sig for Admin Functions

**Current**: Single admin key. Not production-safe.

**Production requirement**: All `onlyOwner` functions should require a 2-of-3 multi-sig. This would be implemented by deploying a Gnosis Safe and transferring ownership to it.

---

### DEPLOYMENT

#### Testnet → Staging → Mainnet Pipeline

Our current pipeline:
```
Local Hardhat ──► Sepolia Testnet ──► Mainnet (or Polygon)
(npm run node)    (npm run deploy     (production deploy)
                  --network sepolia)
```

For Sepolia deployment, `hardhat.config.js` would need:
```js
sepolia: {
  url: `https://eth-sepolia.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  accounts: [DEPLOYER_PRIVATE_KEY]
}
```

#### Professional Security Audit

For a production REIT platform:
- Commission audit from Trail of Bits, OpenZeppelin, or Halborn
- Provide threat model and full specification, not just code
- Budget 3–8 weeks
- Publish audit report publicly

For this project: Internal code review and peer testing suffices.

#### Bug Bounty Program

Production recommendation: Launch on Immunefi with bounties proportional to TVL (10–20% of locked funds for critical bugs).

#### Incident Response Plan

For this project's demo:
- If contracts fail: `npm run deploy` redeploys, update `config.js` with new addresses
- If Hardhat node crashes: restart with `npm run node`, redeploy

Production plan would include: contract pause function, multi-sig emergency response, public communication template.

#### Monitoring & Alerting

Production: OpenZeppelin Defender or Tenderly to alert on:
- Large ETH movements (>X ETH from contract)
- Failed transactions on critical functions
- Unusual gas spikes

#### Documentation & Verified Source Code

Production: Verify source code on Etherscan immediately after deployment. This project's contracts are open source on GitHub.

---

### COMMON CONCERNS

#### Decentralization Roadmap

TokenIT is currently **centralized** at launch:
- Single admin key controls all property operations
- Contracts are not upgradeable by the community

Progressive decentralization path:
1. Multi-sig for admin (Phase 0)
2. Governance voting for property decisions (Phase 3)
3. DAO governance for platform parameters (future)

#### Oracle Design

Current: No oracles — all prices set manually by admin.

Production need: Chainlink ETH/USD price feed to show property values in dollars. Must design for oracle failure (stale data → use last known price, not 0).

#### Dependency Management

External contracts called:
- `PropertyShares.transfer()` called from `TokenIT.buyShares()` — trusted because `TokenIT` deployed it
- `PropertyShares.transferFrom()` called from `TokenIT.transferShares()` — same trust

OpenZeppelin dependencies: version-pinned via `package.json`. Monitor for governance changes.

#### Community & Governance

Not yet implemented. Future Phase 3 will add on-chain voting for property sale decisions, weighted by share ownership. Time-locks would prevent flash-loan governance attacks.

---

*This document should be reviewed before any presentation or viva. All answers are grounded in the actual code in this repository.*
