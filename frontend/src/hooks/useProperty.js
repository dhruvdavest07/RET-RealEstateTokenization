import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export function useProperty(contract, account) {
  const [property, setProperty] = useState(null);
  const [investorInfo, setInvestorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load property details
  const loadProperty = useCallback(async (propertyId) => {
    if (!contract) {
      setError('Contract not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading property:', propertyId);
      console.log('Contract address:', contract.address);
      console.log('Account:', account);

      // First check if contract exists
      const provider = contract.provider;
      const code = await provider.getCode(contract.address);
      console.log('Contract code at address:', code);
      
      if (code === '0x') {
        setError(`No contract found at ${contract.address}. Hardhat node may have been reset.`);
        setIsLoading(false);
        return;
      }

      const propertyData = await contract.getProperty(propertyId);
      console.log('Property data:', propertyData);
      
      // Check if property exists
      if (!propertyData || propertyData.propertyId.toString() === '0') {
        setError(`Property #${propertyId} does not exist. Run: await TokenIT.registerAndFractionalizeProperty("Location", ethers.utils.parseEther("100"), 1000)`);
        setIsLoading(false);
        return;
      }
      
      // Get available shares from the share token contract
      const shareTokenContract = new ethers.Contract(
        propertyData.shareToken,
        ['function getAvailableShares() view returns (uint256)', 'function balanceOf(address) view returns (uint256)'],
        contract.provider
      );
      const availableShares = await shareTokenContract.getAvailableShares();
      
      setProperty({
        propertyId: propertyData.propertyId.toString(),
        nftTokenId: propertyData.nftTokenId.toString(),
        shareToken: propertyData.shareToken,
        totalShares: propertyData.totalShares.toString(),
        availableShares: availableShares.toString(),
        shareSaleProceeds: ethers.utils.formatEther(propertyData.shareSaleProceeds || 0),
        rentPool: ethers.utils.formatEther(propertyData.rentPool),
        fractionalized: propertyData.fractionalized,
        sharePrice: ethers.utils.formatEther(propertyData.sharePrice),
        minPurchaseAmount: propertyData.minPurchaseAmount?.toString() || '1',
        maxPurchaseAmount: propertyData.maxPurchaseAmount?.toString() || '0',
      });

      // Load investor info if account is connected
      if (account) {
        await loadInvestorInfo(propertyId, account);
      }

    } catch (err) {
      console.error('Error loading property:', err);
      const errorMessage = err.reason || err.message || 'Unknown error';
      
      if (errorMessage.includes('CALL_EXCEPTION')) {
        setError(`Contract call failed. Possible causes:\n1. Hardhat node was restarted (contracts lost)\n2. Wrong contract address in config\n3. Property #${propertyId} not created\n\nFix: Redeploy contracts and update config.js`);
      } else {
        setError(`Failed to load property: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [contract, account]);

  // Load investor information
  const loadInvestorInfo = useCallback(async (propertyId, investorAddress) => {
    if (!contract) return;

    try {
      const info = await contract.getInvestorInfo(propertyId, investorAddress);
      
      setInvestorInfo({
        sharesOwned: info.sharesOwned.toString(),
        ownershipPercentage: (info.ownershipPercentage.toNumber() / 100).toFixed(2),
        pendingDividends: ethers.utils.formatEther(info.pendingDividends),
      });
    } catch (err) {
      console.error('Error loading investor info:', err);
    }
  }, [contract]);

  // Buy shares
  const buyShares = useCallback(async (propertyId, amount, sharePrice) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const cost = ethers.utils.parseEther(sharePrice).mul(amount);
      
      const tx = await contract.buyShares(propertyId, amount, {
        value: cost,
      });

      await tx.wait();
      
      // Reload data after purchase
      await loadProperty(propertyId);
      
      return tx.hash;
    } catch (err) {
      console.error('Error buying shares:', err);
      throw err;
    }
  }, [contract, loadProperty]);

  // Claim dividends
  const claimDividends = useCallback(async (propertyId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.claimDividends(propertyId);
      await tx.wait();
      
      // Reload data after claim
      await loadProperty(propertyId);
      
      return tx.hash;
    } catch (err) {
      console.error('Error claiming dividends:', err);
      throw err;
    }
  }, [contract, loadProperty]);

  // Deposit rent (admin only)
  const depositRent = useCallback(async (propertyId, amount) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const value = ethers.utils.parseEther(amount);
      
      const tx = await contract.depositRent(propertyId, {
        value: value,
      });

      await tx.wait();
      
      // Reload data after deposit
      await loadProperty(propertyId);
      
      return tx.hash;
    } catch (err) {
      console.error('Error depositing rent:', err);
      throw err;
    }
  }, [contract, loadProperty]);

  // Check if connected account is admin
  const checkIsAdmin = useCallback(async () => {
    console.log("Checking admin status...");
    console.log("Contract:", contract?.address);
    console.log("Account:", account);
    
    if (!contract || !account) {
      console.log("Missing contract or account");
      return false;
    }

    try {
      const owner = await contract.owner();
      console.log("Contract owner:", owner);
      console.log("Connected account:", account);
      const isAdmin = owner.toLowerCase() === account.toLowerCase();
      console.log("Is admin:", isAdmin);
      return isAdmin;
    } catch (err) {
      console.error("Error checking admin:", err);
      return false;
    }
  }, [contract, account]);

  // Register a new property (admin only)
  const registerProperty = useCallback(async (location, valueWei, totalShares, minPurchase = 1, maxPurchase = 0) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      // Use full function signature for overloaded function
      const tx = await contract['registerAndFractionalizeProperty(string,uint256,uint256,uint256,uint256)'](location, valueWei, totalShares, minPurchase, maxPurchase);
      const receipt = await tx.wait();

      // attempt to parse the event to retrieve the new property id
      let newId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === 'PropertyFractionalized') {
            newId = parsed.args.propertyId.toString();
            break;
          }
        } catch (e) {
          // ignore logs that don't belong to this interface
        }
      }

      return { txHash: tx.hash, propertyId: newId };
    } catch (err) {
      console.error('Error registering property:', err);
      throw err;
    }
  }, [contract]);

  // Withdraw share sale proceeds (admin only)
  const withdrawShareSaleProceeds = useCallback(async (propertyId, amount = '0') => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const amountWei = amount === '0' ? '0' : ethers.utils.parseEther(amount);
      const tx = await contract.withdrawShareSaleProceeds(propertyId, amountWei);
      await tx.wait();
      
      // Reload data after withdrawal
      await loadProperty(propertyId);
      
      return tx.hash;
    } catch (err) {
      console.error('Error withdrawing proceeds:', err);
      throw err;
    }
  }, [contract, loadProperty]);

  return {
    property,
    investorInfo,
    isLoading,
    error,
    loadProperty,
    loadInvestorInfo,
    buyShares,
    claimDividends,
    depositRent,
    checkIsAdmin,
    registerProperty,
    withdrawShareSaleProceeds,
  };
}
