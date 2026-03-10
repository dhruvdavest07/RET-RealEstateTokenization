const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           TokenIT - FULL DEMO FLOW                               ║");
  console.log("║   Blockchain REIT Platform - University Project                  ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Get signers
  const [admin, investor1, investor2, investor3] = await ethers.getSigners();
  
  console.log("Accounts:");
  console.log("  Admin:     ", admin.address);
  console.log("  Investor 1:", investor1.address);
  console.log("  Investor 2:", investor2.address);
  console.log("  Investor 3:", investor3.address);
  console.log("\n");

  // Deploy contracts
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("PHASE 1: CONTRACT DEPLOYMENT");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const PropertyNFT = await ethers.getContractFactory("PropertyNFT", admin);
  const propertyNFT = await PropertyNFT.deploy();
  await propertyNFT.deployed();
  const propertyNFTAddress = propertyNFT.address;
  console.log("✅ PropertyNFT deployed at:", propertyNFTAddress);

  const TokenIT = await ethers.getContractFactory("TokenIT", admin);
  const tokenIT = await TokenIT.deploy(propertyNFTAddress);
  await tokenIT.deployed();
  const tokenITAddress = tokenIT.address;
  console.log("✅ TokenIT deployed at:    ", tokenITAddress);

  // Transfer NFT ownership to TokenIT
  const txOwnership = await propertyNFT.connect(admin).transferOwnership(tokenITAddress);
  await txOwnership.wait();
  console.log("✅ PropertyNFT ownership transferred to TokenIT\n");

  // Get contract instances connected to different signers
  const tokenITAdmin = tokenIT.connect(admin);
  const tokenITInvestor1 = tokenIT.connect(investor1);
  const tokenITInvestor2 = tokenIT.connect(investor2);

  // ============================================
  // PHASE 2: REGISTER AND FRACTIONALIZE PROPERTY
  // ============================================
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("PHASE 2: REGISTER & FRACTIONALIZE PROPERTY");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const propertyLocation = "123 Blockchain Avenue, Crypto City";
  const propertyValue = ethers.utils.parseEther("100"); // 100 ETH
  const totalShares = 1000;

  console.log("Property Details:");
  console.log("  Location:", propertyLocation);
  console.log("  Value:   ", ethers.utils.formatEther(propertyValue), "ETH");
  console.log("  Shares:  ", totalShares);
  console.log("");

  const txFractionalize = await tokenITAdmin.registerAndFractionalizeProperty(
    propertyLocation,
    propertyValue,
    totalShares
  );
  const receiptFractionalize = await txFractionalize.wait();

  console.log("Transaction Details:");
  console.log("  Hash:       ", txFractionalize.hash);
  console.log("  Block:      ", receiptFractionalize.blockNumber);
  console.log("  Gas Used:   ", receiptFractionalize.gasUsed.toString());
  console.log("");

  // Parse event
  const event = receiptFractionalize.logs.find(
    log => {
      try {
        const parsed = tokenIT.interface.parseLog(log);
        return parsed && parsed.name === "PropertyFractionalized";
      } catch (e) {
        return false;
      }
    }
  );
  
  if (event) {
    const parsedEvent = tokenIT.interface.parseLog(event);
    console.log("Event: PropertyFractionalized");
    console.log("  Property ID:  ", parsedEvent.args.propertyId.toString());
    console.log("  Share Token:  ", parsedEvent.args.shareToken);
    console.log("  Total Shares: ", parsedEvent.args.totalShares.toString());
    console.log("  Share Price:  ", ethers.utils.formatEther(parsedEvent.args.sharePrice), "ETH");
  }

  const propertyId = 1;
  const property = await tokenIT.getProperty(propertyId);
  const shareTokenAddress = property.shareToken;
  
  console.log("\n✅ Property #1 fractionalized successfully!\n");

  // Get PropertyShares contract
  const PropertyShares = await ethers.getContractFactory("PropertyShares");
  const shareToken = PropertyShares.attach(shareTokenAddress);

  // ============================================
  // PHASE 3: INVESTORS BUY SHARES
  // ============================================
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("PHASE 3: INVESTORS BUY SHARES");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const sharePrice = property.sharePrice;
  console.log("Share Price:", ethers.utils.formatEther(sharePrice), "ETH\n");

  // Investor 1 buys 200 shares
  console.log("--- Investor 1 Buying 200 Shares ---");
  const shares1 = 200;
  const cost1 = sharePrice.mul(shares1);
  const txBuy1 = await tokenITInvestor1.buyShares(propertyId, shares1, { value: cost1 });
  const receiptBuy1 = await txBuy1.wait();
  
  console.log("Transaction Hash:", txBuy1.hash);
  console.log("Block Number:    ", receiptBuy1.blockNumber);
  console.log("Shares Bought:   ", shares1);
  console.log("Cost Paid:       ", ethers.utils.formatEther(cost1), "ETH");
  console.log("✅ Purchased!\n");

  // Investor 2 buys 300 shares
  console.log("--- Investor 2 Buying 300 Shares ---");
  const shares2 = 300;
  const cost2 = sharePrice.mul(shares2);
  const txBuy2 = await tokenITInvestor2.buyShares(propertyId, shares2, { value: cost2 });
  const receiptBuy2 = await txBuy2.wait();
  
  console.log("Transaction Hash:", txBuy2.hash);
  console.log("Block Number:    ", receiptBuy2.blockNumber);
  console.log("Shares Bought:   ", shares2);
  console.log("Cost Paid:       ", ethers.utils.formatEther(cost2), "ETH");
  console.log("✅ Purchased!\n");

  // Check balances
  const balance1 = await shareToken.balanceOf(investor1.address);
  const balance2 = await shareToken.balanceOf(investor2.address);
  const balanceAdmin = await shareToken.balanceOf(tokenITAddress);

  console.log("Share Balances After Purchase:");
  console.log("  Investor 1:  ", balance1.toString(), "shares (", (Number(balance1) / totalShares * 100).toFixed(1), "%)");
  console.log("  Investor 2:  ", balance2.toString(), "shares (", (Number(balance2) / totalShares * 100).toFixed(1), "%)");
  console.log("  TokenIT:     ", balanceAdmin.toString(), "shares (", (Number(balanceAdmin) / totalShares * 100).toFixed(1), "%)");
  console.log("");

  // ============================================
  // PHASE 4: ADMIN DEPOSITS RENTAL INCOME
  // ============================================
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("PHASE 4: ADMIN DEPOSITS RENTAL INCOME");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const rentAmount = ethers.utils.parseEther("10"); // 10 ETH rent
  console.log("Rent Amount:", ethers.utils.formatEther(rentAmount), "ETH\n");

  const txRent = await tokenITAdmin.depositRent(propertyId, { value: rentAmount });
  const receiptRent = await txRent.wait();

  console.log("Transaction Hash:", txRent.hash);
  console.log("Block Number:    ", receiptRent.blockNumber);
  console.log("Gas Used:        ", receiptRent.gasUsed.toString());

  // Parse RentDeposited event
  const rentEvent = receiptRent.logs.find(log => {
    try {
      const parsed = tokenIT.interface.parseLog(log);
      return parsed && parsed.name === "RentDeposited";
    } catch (e) {
      return false;
    }
  });

  if (rentEvent) {
    const parsedRent = tokenIT.interface.parseLog(rentEvent);
    console.log("\nEvent: RentDeposited");
    console.log("  Property ID:   ", parsedRent.args.propertyId.toString());
    console.log("  Amount:        ", ethers.utils.formatEther(parsedRent.args.amount), "ETH");
    console.log("  New Rent Pool: ", ethers.utils.formatEther(parsedRent.args.newRentPool), "ETH");
  }

  const propertyAfterRent = await tokenIT.getProperty(propertyId);
  console.log("\n✅ Rent deposited! Rent Pool:", ethers.utils.formatEther(propertyAfterRent.rentPool), "ETH\n");

  // ============================================
  // PHASE 5: INVESTORS CLAIM DIVIDENDS
  // ============================================
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("PHASE 5: INVESTORS CLAIM DIVIDENDS");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  // Calculate expected dividends
  // Investor 1: 200/1000 * 10 ETH = 2 ETH
  // Investor 2: 300/1000 * 10 ETH = 3 ETH

  console.log("Expected Dividends:");
  console.log("  Investor 1: 200/1000 * 10 ETH = 2 ETH");
  console.log("  Investor 2: 300/1000 * 10 ETH = 3 ETH\n");

  // Get balances before
  const balanceBefore1 = await ethers.provider.getBalance(investor1.address);
  const balanceBefore2 = await ethers.provider.getBalance(investor2.address);

  // Investor 1 claims
  console.log("--- Investor 1 Claiming Dividends ---");
  const pending1Before = await tokenIT.getPendingDividends(propertyId, investor1.address);
  console.log("Pending Dividends:", ethers.utils.formatEther(pending1Before), "ETH");

  const txClaim1 = await tokenITInvestor1.claimDividends(propertyId);
  const receiptClaim1 = await txClaim1.wait();

  console.log("Transaction Hash:", txClaim1.hash);
  console.log("Block Number:    ", receiptClaim1.blockNumber);
  console.log("Gas Used:        ", receiptClaim1.gasUsed.toString());
  console.log("✅ Dividends claimed!\n");

  // Investor 2 claims
  console.log("--- Investor 2 Claiming Dividends ---");
  const pending2Before = await tokenIT.getPendingDividends(propertyId, investor2.address);
  console.log("Pending Dividends:", ethers.utils.formatEther(pending2Before), "ETH");

  const txClaim2 = await tokenITInvestor2.claimDividends(propertyId);
  const receiptClaim2 = await txClaim2.wait();

  console.log("Transaction Hash:", txClaim2.hash);
  console.log("Block Number:    ", receiptClaim2.blockNumber);
  console.log("Gas Used:        ", receiptClaim2.gasUsed.toString());
  console.log("✅ Dividends claimed!\n");

  // Get balances after
  const balanceAfter1 = await ethers.provider.getBalance(investor1.address);
  const balanceAfter2 = await ethers.provider.getBalance(investor2.address);

  // Note: Balance difference includes gas costs
  console.log("Balance Changes (including gas costs):");
  console.log("  Investor 1: ", ethers.utils.formatEther(balanceAfter1.sub(balanceBefore1)), "ETH");
  console.log("  Investor 2: ", ethers.utils.formatEther(balanceAfter2.sub(balanceBefore2)), "ETH");
  console.log("");

  // ============================================
  // PHASE 6: INVESTOR TRANSFERS SHARES
  // ============================================
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("PHASE 6: INVESTOR TRANSFERS SHARES");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  console.log("--- Investor 1 Transferring 50 Shares to Investor 3 ---\n");

  // Investor 1 approves and transfers
  const sharesToTransfer = 50;
  const shareTokenInvestor1 = shareToken.connect(investor1);
  
  // Approve
  const txApprove = await shareTokenInvestor1.approve(tokenITAddress, sharesToTransfer);
  await txApprove.wait();
  console.log("✅ Approved TokenIT to transfer shares");

  // Transfer via TokenIT wrapper
  const txTransfer = await tokenITInvestor1.transferShares(propertyId, investor3.address, sharesToTransfer);
  const receiptTransfer = await txTransfer.wait();

  console.log("Transaction Hash:", txTransfer.hash);
  console.log("Block Number:    ", receiptTransfer.blockNumber);
  console.log("Transferred:     ", sharesToTransfer, "shares");
  console.log("From:            ", investor1.address);
  console.log("To:              ", investor3.address);
  console.log("✅ Transfer complete!\n");

  // Check final balances
  const finalBalance1 = await shareToken.balanceOf(investor1.address);
  const finalBalance2 = await shareToken.balanceOf(investor2.address);
  const finalBalance3 = await shareToken.balanceOf(investor3.address);

  console.log("Final Share Balances:");
  console.log("  Investor 1:  ", finalBalance1.toString(), "shares (", (Number(finalBalance1) / totalShares * 100).toFixed(1), "%)");
  console.log("  Investor 2:  ", finalBalance2.toString(), "shares (", (Number(finalBalance2) / totalShares * 100).toFixed(1), "%)");
  console.log("  Investor 3:  ", finalBalance3.toString(), "shares (", (Number(finalBalance3) / totalShares * 100).toFixed(1), "%)");
  console.log("");

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("DEMO COMPLETE - SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const finalProperty = await tokenIT.getProperty(propertyId);
  const totalProperties = await tokenIT.getTotalProperties();

  console.log("Property #1 Stats:");
  console.log("  Total Shares:    ", finalProperty.totalShares.toString());
  console.log("  Share Token:     ", finalProperty.shareToken.slice(0, 20) + "...");
  console.log("  Rent Pool:       ", ethers.utils.formatEther(finalProperty.rentPool), "ETH");
  console.log("  Fractionalized:  ", finalProperty.fractionalized);
  console.log("");

  console.log("Total Properties Created:", totalProperties.toString());
  console.log("");

  // Investor info summary
  const info1 = await tokenIT.getInvestorInfo(propertyId, investor1.address);
  const info2 = await tokenIT.getInvestorInfo(propertyId, investor2.address);
  const info3 = await tokenIT.getInvestorInfo(propertyId, investor3.address);

  console.log("Investor Summary:");
  console.log("  Investor 1:  Shares:", info1.sharesOwned.toString(), 
              "| Ownership:", (Number(info1.ownershipPercentage) / 100).toFixed(2) + "%",
              "| Claimed:", ethers.utils.formatEther(await tokenIT.claimedDividends(propertyId, investor1.address)), "ETH");
  console.log("  Investor 2:  Shares:", info2.sharesOwned.toString(), 
              "| Ownership:", (Number(info2.ownershipPercentage) / 100).toFixed(2) + "%",
              "| Claimed:", ethers.utils.formatEther(await tokenIT.claimedDividends(propertyId, investor2.address)), "ETH");
  console.log("  Investor 3:  Shares:", info3.sharesOwned.toString(), 
              "| Ownership:", (Number(info3.ownershipPercentage) / 100).toFixed(2) + "%",
              "| Claimed:", ethers.utils.formatEther(await tokenIT.claimedDividends(propertyId, investor3.address)), "ETH");

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║         ✅ TOKENIT DEMO COMPLETED SUCCESSFULLY!                  ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Demo failed:");
    console.error(error);
    process.exit(1);
  });
