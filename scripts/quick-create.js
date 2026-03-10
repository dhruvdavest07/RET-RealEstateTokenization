/**
 * Quick Property Creation Script
 * 
 * Usage:
 *   npx hardhat run scripts/quick-create.js --network localhost
 * 
 * Or set environment variables:
 *   LOCATION="123 Main St" VALUE_ETH="100" SHARES="1000" npx hardhat run scripts/quick-create.js
 */

const hre = require("hardhat");

// Default property values (change these or use env vars)
const DEFAULT_LOCATION = process.env.LOCATION || "789 Palm Boulevard, Miami, FL";
const DEFAULT_VALUE_ETH = process.env.VALUE_ETH || "50";  // 50 ETH
const DEFAULT_SHARES = process.env.SHARES || "500";       // 500 shares

async function main() {
  const { ethers } = hre;
  
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           🏠 TokenIT - Quick Property Creator                    ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Deploy fresh contracts
  console.log("\n📦 Deploying contracts...\n");
  
  const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
  const propertyNFT = await PropertyNFT.deploy();
  await propertyNFT.deployed();
  console.log("✅ PropertyNFT:", propertyNFT.address);

  const TokenIT = await ethers.getContractFactory("TokenIT");
  const tokenIT = await TokenIT.deploy(propertyNFT.address);
  await tokenIT.deployed();
  console.log("✅ TokenIT:    ", tokenIT.address);

  await (await propertyNFT.transferOwnership(tokenIT.address)).wait();
  console.log("✅ Ownership transferred\n");

  // Create property
  const location = DEFAULT_LOCATION;
  const value = ethers.utils.parseEther(DEFAULT_VALUE_ETH);
  const shares = parseInt(DEFAULT_SHARES);

  console.log("📋 Property Details:");
  console.log("  Location:", location);
  console.log("  Value:   ", DEFAULT_VALUE_ETH, "ETH");
  console.log("  Shares:  ", shares);
  console.log("");

  const tx = await tokenIT.registerAndFractionalizeProperty(location, value, shares);
  const receipt = await tx.wait();

  // Get property ID from event
  const event = receipt.logs.find(log => {
    try {
      const parsed = tokenIT.interface.parseLog(log);
      return parsed && parsed.name === "PropertyFractionalized";
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsed = tokenIT.interface.parseLog(event);
    const propertyId = parsed.args.propertyId.toString();
    const shareToken = parsed.args.shareToken;
    const sharePrice = ethers.utils.formatEther(parsed.args.sharePrice);

    console.log("✅ Property #" + propertyId + " Created!\n");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("Contract Addresses:");
    console.log("  PropertyNFT:", propertyNFT.address);
    console.log("  TokenIT:    ", tokenIT.address);
    console.log("");
    console.log("Property #" + propertyId + ":");
    console.log("  Location:   ", location);
    console.log("  Value:      ", DEFAULT_VALUE_ETH, "ETH");
    console.log("  Shares:     ", shares);
    console.log("  Share Price:", sharePrice, "ETH");
    console.log("  Share Token:", shareToken);
    console.log("═══════════════════════════════════════════════════════════════════\n");

    console.log("🎉 Next steps:");
    console.log("   1. Buy shares: npx hardhat run scripts/demo.js --network localhost");
    console.log("   2. Or interact via frontend");
    console.log("");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
