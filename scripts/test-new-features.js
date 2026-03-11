const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Testing New Contract Features");
  console.log("═══════════════════════════════════════════════════════════\n");

  const [admin, investor1, investor2] = await ethers.getSigners();
  console.log("Admin:", admin.address);
  console.log("Investor 1:", investor1.address);
  console.log("Investor 2:", investor2.address);

  // Connect to contracts
  const tokenITAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
  const propertyNFTAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
  
  const TokenIT = await ethers.getContractFactory("TokenIT");
  const tokenIT = TokenIT.attach(tokenITAddress);

  console.log("\n📦 Connected to contracts");
  console.log("   TokenIT:", tokenITAddress);

  // Create property with min/max purchase limits
  console.log("\n🏠 Creating Property with purchase limits...");
  const location = "Luxury Villa, Beverly Hills";
  const value = ethers.utils.parseEther("100"); // 100 ETH
  const totalShares = 1000;
  const minPurchase = 10;  // Min 10 shares
  const maxPurchase = 100; // Max 100 shares per transaction

  const tx = await tokenIT['registerAndFractionalizeProperty(string,uint256,uint256,uint256,uint256)'](
    location, 
    value, 
    totalShares, 
    minPurchase, 
    maxPurchase
  );
  const receipt = await tx.wait();
  
  // Get property ID from event
  const event = receipt.logs.find(log => {
    try {
      const parsed = tokenIT.interface.parseLog(log);
      return parsed && parsed.name === "PropertyFractionalized";
    } catch (e) { return false; }
  });
  
  const propertyId = event ? tokenIT.interface.parseLog(event).args.propertyId.toString() : '1';
  console.log("✅ Property #" + propertyId + " created!");
  console.log("   Location:", location);
  console.log("   Value: 100 ETH");
  console.log("   Total Shares:", totalShares);
  console.log("   Min Purchase:", minPurchase);
  console.log("   Max Purchase:", maxPurchase);

  // Get property details
  const property = await tokenIT.getProperty(propertyId);
  console.log("\n📊 Property Details from Contract:");
  console.log("   Share Price:", ethers.utils.formatEther(property.sharePrice), "ETH");
  console.log("   Min Purchase:", property.minPurchaseAmount.toString());
  console.log("   Max Purchase:", property.maxPurchaseAmount.toString());

  // Test: Investor 1 tries to buy less than minimum (should fail)
  console.log("\n🧪 Test 1: Buying below minimum (5 shares) - Should FAIL");
  try {
    const tokenITInvestor1 = tokenIT.connect(investor1);
    await tokenITInvestor1.buyShares(propertyId, 5, { value: ethers.utils.parseEther("0.5") });
    console.log("   ❌ UNEXPECTED: Transaction succeeded!");
  } catch (err) {
    console.log("   ✅ Expected failure:", err.reason || err.message.slice(0, 50));
  }

  // Test: Investor 1 buys within limits (50 shares)
  console.log("\n🧪 Test 2: Buying within limits (50 shares) - Should SUCCEED");
  try {
    const tokenITInvestor1 = tokenIT.connect(investor1);
    const cost = ethers.utils.parseEther("5"); // 50 shares * 0.1 ETH
    const tx = await tokenITInvestor1.buyShares(propertyId, 50, { value: cost });
    await tx.wait();
    console.log("   ✅ Successfully bought 50 shares!");
    
    // Check share sale proceeds
    const proceeds = await tokenIT.getShareSaleProceeds(propertyId);
    console.log("   💰 Share Sale Proceeds:", ethers.utils.formatEther(proceeds), "ETH");
  } catch (err) {
    console.log("   ❌ Failed:", err.reason || err.message.slice(0, 50));
  }

  // Test: Investor 2 tries to buy more than max (150 shares) - should fail
  console.log("\n🧪 Test 3: Buying above maximum (150 shares) - Should FAIL");
  try {
    const tokenITInvestor2 = tokenIT.connect(investor2);
    await tokenITInvestor2.buyShares(propertyId, 150, { value: ethers.utils.parseEther("15") });
    console.log("   ❌ UNEXPECTED: Transaction succeeded!");
  } catch (err) {
    console.log("   ✅ Expected failure:", err.reason || err.message.slice(0, 50));
  }

  // Test: Admin withdraws share sale proceeds
  console.log("\n🧪 Test 4: Admin withdraws share sale proceeds");
  try {
    const proceedsBefore = await tokenIT.getShareSaleProceeds(propertyId);
    console.log("   Proceeds before:", ethers.utils.formatEther(proceedsBefore), "ETH");
    
    const tx = await tokenIT.withdrawShareSaleProceeds(propertyId, 0); // 0 = withdraw all
    await tx.wait();
    
    const proceedsAfter = await tokenIT.getShareSaleProceeds(propertyId);
    console.log("   Proceeds after:", ethers.utils.formatEther(proceedsAfter), "ETH");
    console.log("   ✅ Successfully withdrew proceeds!");
  } catch (err) {
    console.log("   ❌ Failed:", err.reason || err.message.slice(0, 50));
  }

  // Test: Deposit rent and check rent pool is separate
  console.log("\n🧪 Test 5: Deposit rent (separate from share proceeds)");
  try {
    const tx = await tokenIT.depositRent(propertyId, { value: ethers.utils.parseEther("10") });
    await tx.wait();
    
    const property = await tokenIT.getProperty(propertyId);
    console.log("   Rent Pool:", ethers.utils.formatEther(property.rentPool), "ETH");
    console.log("   Share Sale Proceeds:", ethers.utils.formatEther(property.shareSaleProceeds), "ETH");
    console.log("   ✅ Rent deposited separately!");
  } catch (err) {
    console.log("   ❌ Failed:", err.reason || err.message.slice(0, 50));
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  All Tests Completed!");
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
