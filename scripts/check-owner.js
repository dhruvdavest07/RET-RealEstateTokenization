const hre = require("hardhat");

async function main() {
  const TokenIT = await hre.ethers.getContractFactory("TokenIT");
  const tokenIT = TokenIT.attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
  
  const owner = await tokenIT.owner();
  console.log("Contract Owner:", owner);
  console.log("Expected Admin:", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  console.log("Match:", owner.toLowerCase() === "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase());
}

main().then(() => process.exit(0)).catch(console.error);
