// ============================================
// CONTRACT CONFIGURATION
// ============================================
// 
// PASTE YOUR DEPLOYED CONTRACT ADDRESSES HERE
// Run `npm run deploy` in your Hardhat project to get these

export const CONTRACT_ADDRESSES = {
  // TokenIT contract address (UPDATE THIS after each deploy)
  TOKEN_IT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  
  // PropertyNFT contract address (UPDATE THIS after each deploy)
  PROPERTY_NFT: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
};

// Hardhat local network configuration
export const NETWORK_CONFIG = {
  chainId: "0x7a69", // 31337 in hex
  chainName: "Hardhat Local",
  rpcUrl: "http://127.0.0.1:8545",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
};

// ============================================
// CONTRACT ABIs
// ============================================

export const TOKEN_IT_ABI = [
  // View functions
  "function getProperty(uint256 propertyId) view returns (tuple(uint256 propertyId, uint256 nftTokenId, address shareToken, uint256 totalShares, uint256 rentPool, uint256 shareSaleProceeds, bool fractionalized, uint256 sharePrice, uint256 minPurchaseAmount, uint256 maxPurchaseAmount))",
  "function getTotalProperties() view returns (uint256)",
  "function getPendingDividends(uint256 propertyId, address investor) view returns (uint256)",
  "function getInvestorInfo(uint256 propertyId, address investor) view returns (uint256 sharesOwned, uint256 ownershipPercentage, uint256 pendingDividends)",
  "function getShareSaleProceeds(uint256 propertyId) view returns (uint256)",
  "function claimedDividends(uint256 propertyId, address investor) view returns (uint256)",
  "function propertyCounter() view returns (uint256)",
  "function propertyNFT() view returns (address)",
  "function owner() view returns (address)",
  "function properties(uint256) view returns (uint256 propertyId, uint256 nftTokenId, address shareToken, uint256 totalShares, uint256 rentPool, uint256 shareSaleProceeds, bool fractionalized, uint256 sharePrice, uint256 minPurchaseAmount, uint256 maxPurchaseAmount)",
  
  // Write functions
  "function registerAndFractionalizeProperty(string location, uint256 value, uint256 totalShares) returns (uint256)",
  "function registerAndFractionalizeProperty(string location, uint256 value, uint256 totalShares, uint256 minPurchase, uint256 maxPurchase) returns (uint256)",
  "function buyShares(uint256 propertyId, uint256 amount) payable",
  "function depositRent(uint256 propertyId) payable",
  "function claimDividends(uint256 propertyId)",
  "function transferShares(uint256 propertyId, address to, uint256 amount)",
  "function linkPropertyNFT(uint256 propertyId, uint256 nftTokenId)",
  "function withdrawShareSaleProceeds(uint256 propertyId, uint256 amount)",
  "function setPurchaseLimits(uint256 propertyId, uint256 minPurchase, uint256 maxPurchase)",
  
  // Events
  "event PropertyFractionalized(uint256 indexed propertyId, address indexed shareToken, uint256 totalShares, uint256 sharePrice)",
  "event SharesPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 cost)",
  "event RentDeposited(uint256 indexed propertyId, address indexed depositor, uint256 amount, uint256 newRentPool)",
  "event DividendsClaimed(uint256 indexed propertyId, address indexed investor, uint256 amount)",
  "event SharesTransferred(uint256 indexed propertyId, address indexed from, address indexed to, uint256 amount)",
  "event ShareSaleProceedsWithdrawn(uint256 indexed propertyId, address indexed admin, uint256 amount)",
];

export const PROPERTY_SHARES_ABI = [
  // ERC20 standard
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Custom functions
  "function propertyId() view returns (uint256)",
  "function tokenIT() view returns (address)",
  "function totalShares() view returns (uint256)",
  "function getOwnershipPercentage(address account) view returns (uint256)",
  "function getAvailableShares() view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event SharesTransferred(uint256 indexed propertyId, address indexed from, address indexed to, uint256 amount)",
];

export const PROPERTY_NFT_ABI = [
  "function getProperty(uint256 propertyId) view returns (tuple(uint256 propertyId, string location, uint256 value, uint256 tokenId, bool exists))",
  "function getPropertyByTokenId(uint256 tokenId) view returns (tuple(uint256 propertyId, string location, uint256 value, uint256 tokenId, bool exists))",
  "function propertyExists(uint256 propertyId) view returns (bool)",
  "function getTotalProperties() view returns (uint256)",
  "function owner() view returns (address)",
  "function registerProperty(string location, uint256 value) returns (uint256)",
  "event PropertyRegistered(uint256 indexed propertyId, uint256 indexed tokenId, string location, uint256 value)",
];
