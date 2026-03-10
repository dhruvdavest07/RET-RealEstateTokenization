const hre = require("hardhat");

async function main() {
  const code = await hre.ethers.provider.getCode("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  console.log("Contract code:", code);
  console.log("Has contract:", code !== "0x");
}

main().then(() => process.exit(0)).catch(console.error);
