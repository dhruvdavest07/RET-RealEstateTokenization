const hre = require("hardhat");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const { ethers } = hre;
  
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           🏠 TokenIT - Create New Property                       ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH\n");

  // Check if contracts are already deployed
  let propertyNFTAddress = await ask("Enter PropertyNFT contract address (or press Enter to deploy new): ");
  let tokenITAddress = await ask("Enter TokenIT contract address (or press Enter to deploy new): ");

  let propertyNFT, tokenIT;

  if (!propertyNFTAddress || !tokenITAddress) {
    console.log("\n📦 Deploying new contracts...\n");
    
    // Deploy PropertyNFT
    const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
    propertyNFT = await PropertyNFT.deploy();
    await propertyNFT.deployed();
    propertyNFTAddress = propertyNFT.address;
    console.log("✅ PropertyNFT deployed to:", propertyNFTAddress);

    // Deploy TokenIT
    const TokenIT = await ethers.getContractFactory("TokenIT");
    tokenIT = await TokenIT.deploy(propertyNFTAddress);
    await tokenIT.deployed();
    tokenITAddress = tokenIT.address;
    console.log("✅ TokenIT deployed to:", tokenITAddress);

    // Transfer ownership
    await (await propertyNFT.transferOwnership(tokenITAddress)).wait();
    console.log("✅ PropertyNFT ownership transferred to TokenIT\n");
  } else {
    // Attach to existing contracts
    const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
    propertyNFT = PropertyNFT.attach(propertyNFTAddress);
    
    const TokenIT = await ethers.getContractFactory("TokenIT");
    tokenIT = TokenIT.attach(tokenITAddress);
    console.log("✅ Connected to existing contracts\n");
  }

  // Get property details from user
  console.log("📋 Enter Property Details:\n");
  
  const location = await ask("Property Location: ");
  const valueEth = await ask("Property Value (in ETH): ");
  const totalShares = await ask("Total Shares to Create: ");

  const propertyValue = ethers.utils.parseEther(valueEth);
  const shares = parseInt(totalShares);

  console.log("\n📊 Property Summary:");
  console.log("  Location:", location);
  console.log("  Value:", valueEth, "ETH");
  console.log("  Total Shares:", shares);
  console.log("  Share Price:", (parseFloat(valueEth) / shares).toFixed(6), "ETH\n");

  const confirm = await ask("Proceed with creating this property? (yes/no): ");
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log("❌ Cancelled.");
    rl.close();
    return;
  }

  console.log("\n⏳ Creating property and fractionalizing...\n");

  // Create property
  const tx = await tokenIT.registerAndFractionalizeProperty(
    location,
    propertyValue,
    shares
  );
  
  const receipt = await tx.wait();
  
  // Parse event to get property ID
  const event = receipt.logs.find(log => {
    try {
      const parsed = tokenIT.interface.parseLog(log);
      return parsed && parsed.name === "PropertyFractionalized";
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsedEvent = tokenIT.interface.parseLog(event);
    const propertyId = parsedEvent.args.propertyId.toString();
    const shareToken = parsedEvent.args.shareToken;
    const sharePrice = ethers.utils.formatEther(parsedEvent.args.sharePrice);

    console.log("✅ Property Created Successfully!\n");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("Property Details:");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("  Property ID:  ", propertyId);
    console.log("  Location:     ", location);
    console.log("  Value:        ", valueEth, "ETH");
    console.log("  Total Shares: ", shares);
    console.log("  Share Price:  ", sharePrice, "ETH");
    console.log("  Share Token:  ", shareToken);
    console.log("  Transaction:  ", tx.hash);
    console.log("═══════════════════════════════════════════════════════════════════\n");

    // Save property info to file
    const fs = require('fs');
    const propertyInfo = {
      propertyId,
      location,
      value: valueEth + " ETH",
      totalShares: shares,
      sharePrice: sharePrice + " ETH",
      shareToken,
      propertyNFT: propertyNFTAddress,
      tokenIT: tokenITAddress,
      transactionHash: tx.hash,
      createdAt: new Date().toISOString()
    };

    const filename = `property_${propertyId}_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(propertyInfo, null, 2));
    console.log(`💾 Property info saved to: ${filename}\n`);
  }

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    rl.close();
    process.exit(1);
  });
