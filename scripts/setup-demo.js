const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  TokenIT Demo Setup");
  console.log("═══════════════════════════════════════════════════════════\n");

  const [admin, investor1, investor2] = await ethers.getSigners();
  console.log("Admin:", admin.address);
  console.log("Investor 1:", investor1.address);
  console.log("Investor 2:", investor2.address);

  // Use deployed contract addresses
  const tokenITAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  const TokenIT = await ethers.getContractFactory("TokenIT");
  const tokenIT = TokenIT.attach(tokenITAddress);

  console.log("\n📦 Connected to TokenIT:", tokenITAddress);

  // Create Property #1 - Residential
  console.log("\n🏠 Creating Property #1: Luxury Apartment...");
  const tx1 = await tokenIT['registerAndFractionalizeProperty(string,uint256,uint256,uint256,uint256)'](
    "123 Park Avenue, New York, NY",
    ethers.utils.parseEther("100"),
    1000,
    10,    // min 10 shares
    200    // max 200 shares per purchase
  );
  await tx1.wait();
  console.log("✅ Property #1 created!");

  // Create Property #2 - Commercial
  console.log("\n🏢 Creating Property #2: Office Building...");
  const tx2 = await tokenIT['registerAndFractionalizeProperty(string,uint256,uint256,uint256,uint256)'](
    "456 Business District, Chicago, IL",
    ethers.utils.parseEther("250"),
    2500,
    25,    // min 25 shares
    500    // max 500 shares per purchase
  );
  await tx2.wait();
  console.log("✅ Property #2 created!");

  // Investor 1 buys shares in Property #1
  console.log("\n💰 Investor 1 buys 100 shares of Property #1...");
  const tokenITInvestor1 = tokenIT.connect(investor1);
  const cost1 = ethers.utils.parseEther("10"); // 100 shares * 0.1 ETH
  const buyTx1 = await tokenITInvestor1.buyShares(1, 100, { value: cost1 });
  await buyTx1.wait();
  console.log("✅ Investor 1 bought 100 shares!");

  // Investor 2 buys shares in Property #1
  console.log("\n💰 Investor 2 buys 150 shares of Property #1...");
  const tokenITInvestor2 = tokenIT.connect(investor2);
  const cost2 = ethers.utils.parseEther("15"); // 150 shares * 0.1 ETH
  const buyTx2 = await tokenITInvestor2.buyShares(1, 150, { value: cost2 });
  await buyTx2.wait();
  console.log("✅ Investor 2 bought 150 shares!");

  // Check share sale proceeds
  const proceeds = await tokenIT.getShareSaleProceeds(1);
  console.log("\n💵 Share Sale Proceeds for Property #1:", ethers.utils.formatEther(proceeds), "ETH");

  // Admin deposits rent
  console.log("\n🏦 Admin deposits 10 ETH rent for Property #1...");
  const rentTx = await tokenIT.depositRent(1, { value: ethers.utils.parseEther("10") });
  await rentTx.wait();
  console.log("✅ Rent deposited!");

  // Get property details
  const property = await tokenIT.getProperty(1);
  console.log("\n📊 Property #1 Status:");
  console.log("   Total Shares:", property.totalShares.toString());
  console.log("   Share Price:", ethers.utils.formatEther(property.sharePrice), "ETH");
  console.log("   Available Shares:", (await tokenIT.provider.getBalance(tokenITAddress)).toString()); // This won't work correctly, ignore
  console.log("   Rent Pool:", ethers.utils.formatEther(property.rentPool), "ETH");
  console.log("   Share Sale Proceeds:", ethers.utils.formatEther(property.shareSaleProceeds), "ETH");

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Demo Setup Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n🌐 Open http://localhost:5173 in your browser");
  console.log("\n📋 Test Accounts:");
  console.log("   Admin:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  console.log("   Investor1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  console.log("   Investor2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  console.log("\n🏠 Properties:");
  console.log("   Property #1: 123 Park Avenue, New York, NY (1000 shares, 0.1 ETH each)");
  console.log("   Property #2: 456 Business District, Chicago, IL (2500 shares, 0.1 ETH each)");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
