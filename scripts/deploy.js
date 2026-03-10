const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("==========================================");
  console.log("     TokenIT Contract Deployment");
  console.log("==========================================\n");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH\n");

  // Deploy PropertyNFT contract
  console.log("------------------------------------------");
  console.log("Step 1: Deploying PropertyNFT contract...");
  console.log("------------------------------------------");
  
  const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
  const propertyNFT = await PropertyNFT.deploy();
  await propertyNFT.deployed();
  
  const propertyNFTAddress = propertyNFT.address;
  console.log("✅ PropertyNFT deployed to:", propertyNFTAddress);
  
  console.log("✅ PropertyNFT deployed successfully\n");

  // Deploy TokenIT contract
  console.log("------------------------------------------");
  console.log("Step 2: Deploying TokenIT contract...");
  console.log("------------------------------------------");
  
  const TokenIT = await ethers.getContractFactory("TokenIT");
  const tokenIT = await TokenIT.deploy(propertyNFTAddress);
  await tokenIT.deployed();
  
  const tokenITAddress = tokenIT.address;
  console.log("✅ TokenIT deployed to:", tokenITAddress);
  
  console.log("✅ TokenIT deployed successfully\n");

  // Transfer ownership of PropertyNFT to TokenIT for integration
  console.log("------------------------------------------");
  console.log("Step 3: Transferring PropertyNFT ownership to TokenIT...");
  console.log("------------------------------------------");
  
  const tx3 = await propertyNFT.transferOwnership(tokenITAddress);
  await tx3.wait();
  
  console.log("✅ Ownership transferred to TokenIT");
  console.log("   Transaction Hash:", tx3.hash);
  console.log("");

  // Verification - check new owner
  const newOwner = await propertyNFT.owner();
  console.log("   Verified new owner:", newOwner);
  console.log("   Matches TokenIT:", newOwner === tokenITAddress);
  console.log("");

  // Summary
  console.log("==========================================");
  console.log("     Deployment Summary");
  console.log("==========================================");
  console.log("PropertyNFT:", propertyNFTAddress);
  console.log("TokenIT:    ", tokenITAddress);
  console.log("");
  console.log("Contract artifacts saved to ./artifacts");
  console.log("==========================================");
  
  return {
    propertyNFT,
    tokenIT,
    propertyNFTAddress,
    tokenITAddress,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

module.exports = { main };
