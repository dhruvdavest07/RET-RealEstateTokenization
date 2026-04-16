# TokenIT — Gas Fees Explained

> **Purpose**: Understand what gas fees are, how to measure them in this project, and how the contracts are optimized to minimize them. Read this before viva so you can answer gas-related questions confidently.

---

## Table of Contents
1. [What Gas Fees Are](#1-what-gas-fees-are)
2. [How to See Gas Used in This Project](#2-how-to-see-gas-used-in-this-project)
3. [Approximate Gas Costs Per Function](#3-approximate-gas-costs-per-function)
4. [How This Project is Optimized](#4-how-this-project-is-optimized)
5. [Viva-Ready One-Paragraph Answer](#5-viva-ready-one-paragraph-answer)

---

## 1. What Gas Fees Are

Every Solidity instruction costs a fixed amount of **gas units**:
- Adding two numbers → 3 gas
- Writing to storage → 20,000 gas
- Deploying a contract → millions of gas

The transaction sender pays:

```
fee = gasUsed × gasPrice
```

- `gasUsed` — total gas the transaction consumed (measured by the EVM)
- `gasPrice` — price per unit of gas, paid in **ETH** (specifically "gwei", where 1 gwei = 0.000000001 ETH)

### Why gas exists
- **Stops infinite loops** — if a contract loops forever, gas runs out and the call reverts
- **Prevents spam** — every action has a cost
- **Pays validators** — the people running Ethereum nodes get the fees as compensation

### On Hardhat vs Mainnet
- **Hardhat (your local node)**: gas is **free** but still **measured** — so you can see what your contract would cost in production
- **Ethereum mainnet**: real money — a typical transaction costs $1–$50 depending on network congestion
- **Sepolia testnet**: also free (uses fake ETH from a faucet), but otherwise behaves like mainnet

---

## 2. How to See Gas Used in This Project

### Option A — From the Hardhat node terminal (Terminal 1)

After every transaction, the Hardhat node prints something like:

```
eth_sendTransaction
  Contract call:       TokenIT#buyShares
  Transaction:         0xabc123...
  From:                0x70997970...
  To:                  0xe7f1725E...
  Value:               10 ETH
  Gas used:            145823 of 30000000
  Block #2:            0x...
```

**That `145823` is the gas the call consumed.** Point at this during the viva — it's live proof.

### Option B — Read it from the transaction receipt in code

After any transaction in a script or Hardhat console:

```js
const tx = await tokenIT.buyShares(1, 100, {
  value: ethers.utils.parseEther("10"),
});
const receipt = await tx.wait();

console.log("Gas used:        ", receipt.gasUsed.toString());
console.log("Gas price (gwei):", ethers.utils.formatUnits(receipt.effectiveGasPrice, "gwei"));
console.log("Total cost (ETH):",
  ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))
);
```

### Option C — Get a full report for every function (best for viva)

The `hardhat-gas-reporter` plugin is included automatically via `hardhat-toolbox`. Run:

```bash
REPORT_GAS=true npx hardhat test
```

You'll see a table like:

```
| Method                              | Min     | Max     | Avg    | # calls |
|-------------------------------------|---------|---------|--------|---------|
| TokenIT.buyShares                   | 145823  | 198541  | 167234 | 12      |
| TokenIT.depositRent                 | 52341   | 52341   | 52341  | 4       |
| TokenIT.claimDividends              | 38912   | 41203   | 40058  | 6       |
| TokenIT.transferShares              | 68900   | 68900   | 68900  | 2       |
| TokenIT.registerAndFractionalize... | 2401211 | 2401211 |2401211 | 5       |
| Marketplace.createListing           | 132100  | 132100  | 132100 | 3       |
| Marketplace.buyListing              | 118450  | 118450  | 118450 | 3       |
```

This is the single most impressive thing you can show during a viva for "how do you measure gas."

---

## 3. Approximate Gas Costs Per Function

| Operation | ~Gas Used | Why It Costs That Much |
|-----------|-----------|------------------------|
| `registerAndFractionalizeProperty` | ~2,500,000 | **Deploys a brand-new ERC20 contract** (PropertyShares) — by far the most expensive op |
| `buyShares` | ~150,000 | Updates 2 storage mappings, transfers ETH in, mints ERC20 tokens to buyer, emits event |
| `depositRent` | ~50,000 | Single storage write to `rentPool` + event |
| `claimDividends` | ~40,000 | Math + storage write to `claimedDividends` + ETH transfer + event |
| `transferShares` | ~70,000 | Calls into PropertyShares contract (cross-contract call adds overhead) |
| `withdrawShareSaleProceeds` | ~45,000 | Storage update + ETH transfer to admin |
| `claimSaleProceeds` (Phase 3) | ~80,000 | Burns ERC20 + ETH transfer + storage updates |
| `Marketplace.createListing` | ~130,000 | New listing struct + 2 mapping writes + event |
| `Marketplace.buyListing` | ~120,000 | Storage write + ERC20 transferFrom + 2 ETH transfers (seller + refund) |

> **Note**: Gas costs vary slightly per call depending on whether storage slots are being **set for the first time** (20,000 gas) vs **updated** (5,000 gas) — that's why ranges exist in the gas report.

---

## 4. How This Project is Optimized

### 4.1 Compiler optimizer is ON

In `hardhat.config.js:6-12`:

```js
solidity: {
  version: "0.8.20",
  settings: {
    optimizer: { enabled: true, runs: 200 }
  }
}
```

- `enabled: true` — tells the Solidity compiler to rearrange/inline bytecode for cheaper execution
- `runs: 200` — tunes the optimizer for **code that's called many times** (vs. cheap-to-deploy-once)
- **Effect**: cuts gas ~20–30% on hot functions

### 4.2 Storage caching ("memory variables")

Reading from storage costs **2,100 gas**. Reading from memory costs **3 gas** — that's ~700× cheaper.

In hot functions like `claimDividends`, the code reads `properties[propertyId]` **once** into a local variable, then reuses that local variable instead of repeatedly hitting storage:

```solidity
Property storage prop = properties[propertyId];   // one storage read
uint256 share = shareToken.balanceOf(msg.sender);
uint256 owed = (share * prop.rentPool) / prop.totalShares;
// ... uses prop.* multiple times — all from memory now
```

### 4.3 Custom `transferOnBehalf` and `burnShares`

The standard ERC20 flow for moving someone else's tokens is **2 transactions**:
1. Owner calls `approve(spender, amount)` (~46,000 gas + user signature)
2. Spender calls `transferFrom(owner, recipient, amount)` (~50,000 gas + user signature)

We added privileged direct-move helpers (`transferOnBehalf`, `burnShares`) to PropertyShares — gated to **only** the TokenIT contract via `require(msg.sender == tokenIT)`. This collapses 2 transactions into 1, saving ~50% gas on transfers and sale redemptions.

### 4.4 Checks-Effects-Interactions (CEI) pattern

Updating state **before** making external calls (used in `claimDividends`, `claimSaleProceeds`, `reinvestDividends`, `Marketplace.buyListing`) does two things:
- **Security**: prevents reentrancy attacks
- **Gas savings**: lets the compiler drop redundant storage reads after the external call returns

### 4.5 Events instead of on-chain arrays for history

We never store "all past purchases" in a Solidity array. Arrays grow forever and reads get exponentially expensive. Instead, every action **emits an event**:

```solidity
emit SharesPurchased(propertyId, msg.sender, amount, cost);
```

- Events cost only ~375 gas each
- They live in the transaction logs, **not in contract storage**
- The frontend reads them via `tokenIT.queryFilter(...)` — cheap and fast

If we used arrays instead, gas would scale O(n) with history size — eventually unusable.

### 4.6 `immutable` for constants

In `Marketplace.sol:30`:
```solidity
ITokenIT public immutable tokenIT;
```

`immutable` variables are **baked into bytecode at deploy time**. Reading them costs ~3 gas (memory) instead of ~2,100 gas (storage). Use this whenever something is set in the constructor and never changes.

### 4.7 Counter pattern instead of array iteration

`propertyCounter`, `listingCounter` are simple `uint256` counters that increment on each new entry. This avoids `properties.length` and array growth — both of which would add gas to every write.

### 4.8 Custom error messages kept short

Long `require` strings cost more gas (each character = 1 byte stored). Our messages are intentionally short:
```solidity
require(amount > 0, "Amount must be greater than zero");
```
Not:
```solidity
require(amount > 0, "The amount you provided is zero, which is not a valid value for this operation. Please provide a positive amount.");
```

---

## 5. Viva-Ready One-Paragraph Answer

> *"Every contract call costs **gas** — measured in units like 145,000 — and paid in ETH. On Ethereum mainnet that's real money; on Hardhat it's free but still measured so we can see what it would cost in production. We see gas usage in three places: live in the Hardhat node terminal logs, programmatically from `receipt.gasUsed` after any transaction, and as a full per-function table by running `REPORT_GAS=true npx hardhat test`. We optimize gas in several ways: **(1) Solidity compiler optimizer enabled with 200 runs** in `hardhat.config.js`, **(2) storage caching** — reading mappings into memory variables once instead of multiple storage hits, **(3) custom `transferOnBehalf` and `burnShares` helpers** that collapse the standard 2-transaction ERC20 approve+transferFrom flow into 1, **(4) events instead of on-chain arrays for history** — events cost ~375 gas each vs. unbounded array growth, and **(5) `immutable` keyword** for constructor-set values that never change. The most expensive operation is property registration at ~2.5 million gas because it deploys a fresh ERC20 contract; cheapest is rent deposit at ~50,000."*
