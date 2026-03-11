const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           🏠 TokenIT - Auto Property Creator                     ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Connect to existing contracts (already deployed)
  const tokenITAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const propertyNFTAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("\n📦 Connecting to existing contracts...\n");
  
  const TokenIT = await ethers.getContractFactory("TokenIT");
  const tokenIT = TokenIT.attach(tokenITAddress);
  
  const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
  const propertyNFT = PropertyNFT.attach(propertyNFTAddress);
  
  console.log("✅ TokenIT:", tokenITAddress);
  console.log("✅ PropertyNFT:", propertyNFTAddress);

  // Create property
  const location = "123 Main Street, New York, NY";
  const valueEth = "100";
  const value = ethers.utils.parseEther(valueEth);
  const shares = 1000;

  console.log("\n📋 Property Details:");
  console.log("  Location:", location);
  console.log("  Value:   ", valueEth, "ETH");
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
    console.log("Property #" + propertyId + ":");
    console.log("  Location:   ", location);
    console.log("  Value:      ", valueEth, "ETH");
    console.log("  Shares:     ", shares);
    console.log("  Share Price:", sharePrice, "ETH");
    console.log("  Share Token:", shareToken);
    console.log("═══════════════════════════════════════════════════════════════════\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
