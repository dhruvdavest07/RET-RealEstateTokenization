# TokenIT — Blockchain Internals & Live Inspection

> **Purpose**: Answer every "show me the blockchain" / "what's a block" / "what algorithm" / "max ETH" / "previous block" question your professor might fire during the demo. Includes **live commands** you can paste into Hardhat console to prove every answer.

---

## Table of Contents
1. [The Big Picture](#1-the-big-picture)
2. [What's Inside a Block?](#2-whats-inside-a-block)
3. [Live Commands — Inspect the Blockchain](#3-live-commands--inspect-the-blockchain)
4. [What's Inside a Transaction?](#4-whats-inside-a-transaction)
5. [ETH Balances & Total Supply (Max ETH)](#5-eth-balances--total-supply-max-eth)
6. [Algorithms Used](#6-algorithms-used)
7. [Hardhat vs Real Ethereum — What's Different](#7-hardhat-vs-real-ethereum--whats-different)
8. [Likely Viva Questions with Crisp Answers](#8-likely-viva-questions-with-crisp-answers)
9. [Cheat Sheet — Memorize These Numbers](#9-cheat-sheet--memorize-these-numbers)

---

## 1. The Big Picture

A **blockchain** is just a chain of **blocks**, each linked to the previous one by a hash. Each block contains a list of **transactions**. Transactions either move ETH or call smart contract functions.

```
Block 0 (Genesis)  ←  Block 1  ←  Block 2  ←  Block 3  ←  ... (latest)
                       contains:    contains:
                       - tx0        - tx0 (deploy PropertyNFT)
                       - tx1        - tx1 (deploy TokenIT)
                                    - tx2 (transferOwnership)
                                    - tx3 (deploy Marketplace)
```

When you call `tokenIT.buyShares(...)`, that's a transaction. It gets bundled into the next block, which gets a new block number, hash, and references the previous block's hash. **Immutable forever** once mined.

---

## 2. What's Inside a Block?

Every Ethereum block (and your Hardhat block) has these fields:

| Field | What it is | Example |
|-------|------------|---------|
| `number` | Block height (sequential, starting at 0) | `5` |
| `hash` | Unique fingerprint of this block (Keccak-256) | `0xabc123...` |
| `parentHash` | Hash of the previous block (this is what "chains" them) | `0xdef456...` |
| `timestamp` | When the block was mined (Unix seconds) | `1729123456` |
| `transactions` | Array of all transaction hashes in this block | `[0xtx1, 0xtx2, ...]` |
| `gasUsed` | Total gas consumed by all transactions in the block | `2500000` |
| `gasLimit` | Maximum gas the block can hold | `30000000` |
| `miner` | Address that mined the block (gets the fees) | `0x000...000` (Hardhat default) |
| `difficulty` | Mining difficulty (legacy, 0 in PoS) | `0` |
| `nonce` | A random number used in PoW (legacy, `0x000` in PoS) | `0x0000000000000000` |
| `stateRoot` | Merkle root of the entire blockchain state | `0x789...` |
| `transactionsRoot` | Merkle root of all transactions in this block | `0xabc...` |
| `receiptsRoot` | Merkle root of all transaction receipts | `0xdef...` |
| `extraData` | Optional extra bytes (often used by miners as a tag) | `0x` |
| `baseFeePerGas` | EIP-1559 base fee | `0x...` |

The 3 "roots" are **Merkle tree roots** — they let anyone prove a transaction or balance was included in that block without downloading the entire blockchain.

---

## 3. Live Commands — Inspect the Blockchain

Open Hardhat console:
```bash
npx hardhat console --network localhost
```

### 3.1 — How many blocks exist right now?
```js
const latest = await ethers.provider.getBlockNumber();
console.log("Latest block number:", latest);
```
- A fresh Hardhat node starts at block `0` (the **genesis block**)
- Each transaction you make = +1 block (Hardhat mines instantly, one block per tx)
- After your demo flow you might be at block ~10–20

### 3.2 — Show the latest block's full contents
```js
const block = await ethers.provider.getBlock("latest");
console.log("Block number:    ", block.number);
console.log("Block hash:      ", block.hash);
console.log("Parent hash:     ", block.parentHash);
console.log("Timestamp:       ", new Date(block.timestamp * 1000).toLocaleString());
console.log("Gas used:        ", block.gasUsed.toString());
console.log("Gas limit:       ", block.gasLimit.toString());
console.log("Miner:           ", block.miner);
console.log("Transactions:    ", block.transactions.length);
console.log("All tx hashes:   ", block.transactions);
```

### 3.3 — Show the PREVIOUS block (very common viva ask)
```js
const latestNum = await ethers.provider.getBlockNumber();
const prev = await ethers.provider.getBlock(latestNum - 1);
console.log("Previous block:");
console.log("  Number:    ", prev.number);
console.log("  Hash:      ", prev.hash);
console.log("  Tx count:  ", prev.transactions.length);
```

### 3.4 — Show the genesis block (block 0)
```js
const genesis = await ethers.provider.getBlock(0);
console.log("Genesis block:");
console.log("  Hash:        ", genesis.hash);
console.log("  Parent hash: ", genesis.parentHash); // 0x0000... (it's the first block, no parent)
console.log("  Timestamp:   ", new Date(genesis.timestamp * 1000).toLocaleString());
```

### 3.5 — Walk the entire chain (impressive demo trick)
```js
const latestNum = await ethers.provider.getBlockNumber();
for (let i = 0; i <= latestNum; i++) {
  const b = await ethers.provider.getBlock(i);
  console.log(`Block #${b.number}  hash: ${b.hash.substring(0,10)}...  txs: ${b.transactions.length}  parent: ${b.parentHash.substring(0,10)}...`);
}
```
Output looks like:
```
Block #0  hash: 0xabc12345...  txs: 0  parent: 0x00000000...
Block #1  hash: 0xdef67890...  txs: 1  parent: 0xabc12345...
Block #2  hash: 0xghi45678...  txs: 1  parent: 0xdef67890...
...
```
**Show the parent hash of block N matches the hash of block N-1** — that's the literal "chain" in blockchain.

### 3.6 — Get the chain ID and network info
```js
const network = await ethers.provider.getNetwork();
console.log("Chain ID:", network.chainId);   // 31337 for Hardhat
console.log("Network name:", network.name);   // "unknown" (Hardhat is custom)
```

---

## 4. What's Inside a Transaction?

Every transaction has:

| Field | What it is |
|-------|------------|
| `hash` | Unique transaction fingerprint |
| `from` | Sender address (EOA — externally owned account) |
| `to` | Recipient address (contract or another EOA) |
| `value` | ETH being sent (in wei — 1 ETH = 10^18 wei) |
| `data` | Encoded function call + arguments (hex blob) |
| `gasLimit` | Max gas the sender will pay for |
| `gasPrice` / `maxFeePerGas` | Price per unit of gas |
| `nonce` | Sender's transaction counter (prevents replay) |
| `v`, `r`, `s` | The ECDSA digital signature (proves the sender authorized it) |
| `blockNumber` | Which block included this tx |
| `blockHash` | Hash of the block that included it |

### Live: inspect any transaction

After a contract call:
```js
const tx = await tokenIT.buyShares(1, 100, { value: ethers.utils.parseEther("10") });
console.log("Tx hash:    ", tx.hash);
console.log("From:       ", tx.from);
console.log("To:         ", tx.to);
console.log("Value (wei):", tx.value.toString());
console.log("Gas limit:  ", tx.gasLimit.toString());
console.log("Nonce:      ", tx.nonce);
console.log("Data (first 80 chars):", tx.data.substring(0, 80));

// After mining
const receipt = await tx.wait();
console.log("Block #:    ", receipt.blockNumber);
console.log("Gas used:   ", receipt.gasUsed.toString());
console.log("Status:     ", receipt.status === 1 ? "Success" : "Failed");
console.log("Events:     ", receipt.events.length);
```

### Get a transaction by hash later
```js
const tx = await ethers.provider.getTransaction("0xabc123...");
const receipt = await ethers.provider.getTransactionReceipt("0xabc123...");
```

---

## 5. ETH Balances & Total Supply (Max ETH)

### Check any address's balance
```js
const bal = await ethers.provider.getBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
console.log("Admin balance:", ethers.utils.formatEther(bal), "ETH");
```

### Check the contract's balance
```js
const contractBal = await ethers.provider.getBalance(tokenIT.address);
console.log("TokenIT contract holds:", ethers.utils.formatEther(contractBal), "ETH");
```
This = `sum(rentPool) + sum(shareSaleProceeds) + sum(saleProceeds)` across all properties.

### How much ETH exists in this Hardhat node?

**On Hardhat:** 20 test accounts × 10,000 ETH each = **200,000 ETH** total. Pre-funded by Hardhat at genesis. No more is ever created (no mining rewards).

```js
const accounts = await ethers.getSigners();
let total = ethers.BigNumber.from(0);
for (const acc of accounts) {
  total = total.add(await ethers.provider.getBalance(acc.address));
}
console.log("Total ETH across all accounts:", ethers.utils.formatEther(total));
// → ~199,997 ETH (slightly less than 200,000 because gas was burned)
```

### Maximum ETH supply on **real Ethereum**

- **There is no hard cap** on the total ETH supply
- Currently (2026): ~120 million ETH in circulation
- Issuance: ~0.5% per year via staking rewards
- Burns: EIP-1559 burns base fees, often making net issuance negative ("ultra sound money" claim)
- **Compare to Bitcoin**: BTC is hard-capped at 21 million coins. ETH is *not*.

---

## 6. Algorithms Used

This is the **most asked viva category**. Memorize these.

### 6.1 Hashing — **Keccak-256** (often misnamed "SHA-3")
- Used for: block hashes, transaction hashes, address derivation, Merkle trees
- Output: 256-bit (32 bytes / 64 hex chars)
- Why Keccak-256 specifically? Ethereum was finalized just before NIST modified SHA-3 — Ethereum kept the original Keccak version
- In Solidity: `keccak256(abi.encodePacked(...))`

### 6.2 Digital signatures — **ECDSA on secp256k1 curve**
- Used for: signing transactions (proving the sender actually authorized the tx)
- Same curve Bitcoin uses
- A signature has 3 parts: `(v, r, s)`
- Your **private key** signs; the **public key** (= your address) verifies
- This is why losing a private key = losing the account forever

### 6.3 Address derivation
1. Generate a random 256-bit private key
2. Compute the public key via secp256k1 elliptic curve multiplication
3. `address = last 20 bytes of keccak256(publicKey)` — that's the `0x...` you see
4. Prefix with `0x` and apply EIP-55 checksum capitalization

### 6.4 Consensus algorithm — depends on the network

| Network | Consensus | Block time |
|---------|-----------|------------|
| **Hardhat (yours)** | **None — single-node simulation, no consensus needed** | Instant (one block per tx) |
| **Ethereum mainnet** | **Proof of Stake (PoS)** since "The Merge" in Sep 2022 | 12 seconds |
| **Ethereum pre-Merge** | Proof of Work (PoW) — mining with GPUs | ~13 seconds |
| **Bitcoin** | Proof of Work (PoW) | ~10 minutes |

> **Important for viva**: don't say "Ethereum uses Proof of Work." That changed in 2022. **Ethereum uses Proof of Stake.** Validators stake 32 ETH and propose/attest blocks; bad actors get their stake **slashed**.

### 6.5 Data structure — **Merkle Patricia Trie**
Ethereum stores all account state, all transactions, and all receipts in **Merkle Patricia Tries** (a hybrid of Merkle trees and radix tries). The root hash of each trie ends up in the block header. This is what makes "**light clients**" possible — you can prove a single account's balance is correct without downloading the whole chain.

### 6.6 Smart contract execution — **EVM (Ethereum Virtual Machine)**
- A stack-based virtual machine that runs compiled bytecode
- Solidity → compiled by `solc` → EVM bytecode → runs on every Ethereum node
- Every node runs the same instructions and reaches the same result (deterministic)

---

## 7. Hardhat vs Real Ethereum — What's Different

| Aspect | Hardhat (yours) | Real Ethereum |
|--------|-----------------|---------------|
| Consensus | **None** (single node) | Proof of Stake |
| Block time | Instant (one block per tx) | 12 seconds |
| Validators | None — Hardhat itself "mines" | ~1 million staked validators |
| Gas cost | Free | Real ETH ($0.50–$50 per tx) |
| Total ETH | 200,000 (pre-funded test ETH) | ~120 million |
| Reset on restart | Yes — wipes everything | Never — immutable |
| Network reach | localhost only (`127.0.0.1:8545`) | Global P2P network |
| Chain ID | 31337 | 1 (mainnet), 11155111 (Sepolia) |

**This is why Hardhat is for development only.** Same Solidity code, totally different runtime context.

---

## 8. Likely Viva Questions with Crisp Answers

### Q1. "How many blocks does your blockchain have right now?"
Run live: `await ethers.provider.getBlockNumber()` → "Currently at block N. Started at block 0 (genesis). Each transaction we made added one block."

### Q2. "Show me the previous block."
```js
const prev = await ethers.provider.getBlock((await ethers.provider.getBlockNumber()) - 1);
console.log(prev);
```
Then explain `parentHash` links it to block N-2, and `block.hash` is what the next block will reference.

### Q3. "What is in a block?"
"Block number, hash, parent hash, timestamp, list of transaction hashes, gas used, gas limit, miner address, and three Merkle roots — state root, transactions root, receipts root. The Merkle roots let anyone prove a transaction or balance was included without downloading the full chain."

### Q4. "Where is the link between blocks?"
"The `parentHash` field. Every block stores the hash of the block before it. If you tampered with block N, every block from N+1 onward would have an invalid `parentHash` — that's what makes blockchains tamper-evident."

### Q5. "What hashing algorithm?"
"**Keccak-256** — output is 32 bytes / 64 hex characters. Used for block hashes, transaction hashes, deriving addresses from public keys, and Merkle tree construction. Often confused with SHA-3 — Ethereum uses the original Keccak before NIST's modifications."

### Q6. "What signature algorithm?"
"**ECDSA on the secp256k1 curve** — same as Bitcoin. Every transaction is signed by the sender's private key with `(v, r, s)` components. The signature proves the sender authorized the transaction; nodes verify it before including the tx in a block."

### Q7. "What consensus mechanism does Ethereum use?"
"**Proof of Stake (PoS)** since The Merge in September 2022. Validators stake 32 ETH and are randomly selected to propose or attest blocks. Misbehavior gets their stake **slashed**. **Note that on Hardhat there's no consensus** — it's a single-node simulator that mines a block instantly per transaction. PoS is what real Ethereum mainnet uses."

### Q8. "What is the maximum ETH that can exist?"
"There is **no hard cap** on ETH supply. Currently around 120 million ETH circulating. Annual issuance is ~0.5% via staking rewards, but **EIP-1559 burns base fees** — when network usage is high, more ETH is burned than issued, making net supply *decrease*. Compare to Bitcoin which is hard-capped at 21 million."

### Q9. "How much ETH is in your blockchain right now?"
"Hardhat pre-funds 20 test accounts with **10,000 ETH each = 200,000 ETH** at genesis. No new ETH is ever created — no mining rewards on Hardhat. Total has decreased slightly because gas fees were burned during our transactions. Let me show you live..." then run the loop from Section 5.

### Q10. "What's the difference between an EOA and a contract address?"
"**EOA = Externally Owned Account** — controlled by a private key, used by humans. Format: 20 bytes derived from `keccak256(publicKey)`.
**Contract account** — has Solidity bytecode at it, no private key. Format: deterministically computed from `keccak256(deployer_address, nonce)`. EOAs initiate transactions; contracts can only react when called."

### Q11. "Show me the genesis block."
```js
const g = await ethers.provider.getBlock(0);
console.log(g);
```
Point out `parentHash = 0x00...00` because there's no block before it.

### Q12. "Walk through what happens when I call buyShares()."
1. MetaMask signs the tx with the investor's private key (ECDSA on secp256k1)
2. The signed tx is sent to the Hardhat node via JSON-RPC
3. Hardhat verifies the signature, checks the nonce, deducts gas
4. The EVM runs the `buyShares` bytecode: validates inputs, transfers ETH into `shareSaleProceeds`, mints ERC20 shares to the buyer, emits `SharesPurchased` event
5. The transaction is included in a new block, hashed with Keccak-256
6. The new block's `parentHash` references the previous block's hash — chain extended
7. Receipt with `gasUsed` and event logs is returned to the caller

### Q13. "What is gas in one sentence?"
"Gas is the unit measuring computational effort — every EVM instruction costs gas, and the sender pays `gasUsed × gasPrice` in ETH to compensate validators for executing the transaction."

### Q14. "What is a Merkle root?"
"A Merkle tree hashes pairs of items together repeatedly until you have one root hash. Change any leaf and the root changes. Ethereum's block header has 3 Merkle roots — state, transactions, and receipts — letting you prove inclusion of any element without downloading everything."

### Q15. "What language are smart contracts written in, and how are they executed?"
"Written in **Solidity** (or Vyper). Compiled by `solc` to **EVM bytecode** — a stack-based virtual machine that runs identically on every Ethereum node. Determinism is critical: every node must reach the same result for consensus to work."

### Q16. "Why is my transaction confirmed instantly on Hardhat but takes 12 seconds on real Ethereum?"
"Hardhat is a single-node simulator with no consensus — it mines a block immediately per transaction. Real Ethereum has thousands of validators that must agree on the next block, and the protocol enforces a 12-second slot time for block proposal."

### Q17. "Can I change a past transaction?"
"No. Each block's hash includes its content. Changing any byte changes the hash, which breaks every subsequent block's `parentHash`. To rewrite history you'd have to re-mine every block from that point on AND beat the entire network's stake — economically impossible. **Immutability** is the core property of blockchains."

---

## 9. Cheat Sheet — Memorize These Numbers

| Concept | Value |
|---------|-------|
| Hardhat chain ID | **31337** |
| Hardhat RPC URL | **http://127.0.0.1:8545** |
| Hardhat test accounts | **20**, each with **10,000 ETH** = 200,000 total |
| 1 ETH | **10^18 wei** (1 followed by 18 zeros) |
| 1 gwei | **10^9 wei** = 0.000000001 ETH |
| Hash algorithm | **Keccak-256** (32 bytes output) |
| Signature algorithm | **ECDSA on secp256k1** |
| Address length | **20 bytes** (40 hex chars + `0x`) |
| Block hash length | **32 bytes** (64 hex chars + `0x`) |
| Ethereum consensus | **Proof of Stake** (since Sep 2022 "Merge") |
| Validator stake required | **32 ETH** |
| Real Ethereum block time | **12 seconds** |
| Hardhat block time | **Instant** (1 block per tx) |
| Block gas limit | **30,000,000 gas** (Ethereum mainnet) |
| Max ETH supply | **None** (no hard cap; ~120M circulating in 2026) |
| Bitcoin max supply | 21,000,000 (for comparison) |
| Smart contract language | **Solidity** (compiled to **EVM bytecode**) |
| Storage data structure | **Merkle Patricia Trie** |

---

## 10. Quickest Live Demo to Prove "I Know What's in the Blockchain"

Open `npx hardhat console --network localhost` and paste:

```js
const num = await ethers.provider.getBlockNumber();
console.log(`\n📊 BLOCKCHAIN STATE\n`);
console.log(`Total blocks: ${num + 1} (blocks 0 to ${num})`);

const latest = await ethers.provider.getBlock("latest");
console.log(`\nLatest block #${latest.number}:`);
console.log(`  Hash:        ${latest.hash}`);
console.log(`  Parent hash: ${latest.parentHash}`);
console.log(`  Timestamp:   ${new Date(latest.timestamp * 1000).toLocaleString()}`);
console.log(`  Tx count:    ${latest.transactions.length}`);
console.log(`  Gas used:    ${latest.gasUsed.toString()} / ${latest.gasLimit.toString()}`);

const prev = await ethers.provider.getBlock(num - 1);
console.log(`\nPrevious block #${prev.number}:`);
console.log(`  Hash:        ${prev.hash}`);
console.log(`  → matches latest's parentHash? ${prev.hash === latest.parentHash ? "YES (chain intact)" : "NO"}`);

const accs = await ethers.getSigners();
let total = ethers.BigNumber.from(0);
for (const a of accs) total = total.add(await ethers.provider.getBalance(a.address));
console.log(`\nTotal ETH on this chain: ${ethers.utils.formatEther(total)} ETH`);

const net = await ethers.provider.getNetwork();
console.log(`Chain ID: ${net.chainId} (Hardhat local)`);
```

This single block of code prints **block count, latest block, previous block, hash linkage proof, total ETH supply, and chain ID** — covers 80% of blockchain-internals viva questions in 10 lines.

Done — read this file once, run the live block above twice, and you can answer anything the professor throws at you.
