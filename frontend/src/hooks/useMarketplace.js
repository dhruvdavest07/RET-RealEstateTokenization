import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { PROPERTY_SHARES_ABI } from '../contracts/config';

export function useMarketplace(marketplaceContract, tokenItContract, account) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const _mapListing = (l) => ({
    listingId: l.listingId.toString(),
    propertyId: l.propertyId.toString(),
    seller: l.seller,
    shareToken: l.shareToken,
    shares: l.shares.toString(),
    pricePerShare: ethers.utils.formatEther(l.pricePerShare),
    pricePerShareWei: l.pricePerShare,
    totalCostEth: ethers.utils.formatEther(l.shares.mul(l.pricePerShare)),
    active: l.active,
  });

  // Load all active listings across all properties
  const loadListings = useCallback(async () => {
    if (!marketplaceContract) return;
    try {
      setIsLoading(true);
      setError(null);
      const raw = await marketplaceContract.getAllActiveListings();
      setListings(raw.map(_mapListing));
    } catch (err) {
      console.error('Error loading listings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [marketplaceContract]);

  // Create a new listing — handles the ERC20 approve step automatically
  const createListing = useCallback(async (propertyId, shares, pricePerShareEth) => {
    if (!marketplaceContract || !tokenItContract) throw new Error('Contracts not initialized');

    const sharesInt = parseInt(shares);
    const priceWei = ethers.utils.parseEther(pricePerShareEth);

    // Get the share token for this property
    const propertyData = await tokenItContract.getProperty(propertyId);
    const shareTokenContract = new ethers.Contract(
      propertyData.shareToken,
      PROPERTY_SHARES_ABI,
      marketplaceContract.signer
    );

    // Approve marketplace if needed
    const allowance = await shareTokenContract.allowance(account, marketplaceContract.address);
    if (allowance.lt(sharesInt)) {
      const approveTx = await shareTokenContract.approve(marketplaceContract.address, sharesInt);
      await approveTx.wait();
    }

    const tx = await marketplaceContract.createListing(propertyId, sharesInt, priceWei);
    await tx.wait();
    await loadListings();
    return tx.hash;
  }, [marketplaceContract, tokenItContract, account, loadListings]);

  // Buy a listing by ID
  const buyListing = useCallback(async (listingId, sharesCount, pricePerShareWei) => {
    if (!marketplaceContract) throw new Error('Marketplace not initialized');

    const totalCost = ethers.BigNumber.from(sharesCount).mul(pricePerShareWei);
    const tx = await marketplaceContract.buyListing(listingId, { value: totalCost });
    await tx.wait();
    await loadListings();
    return tx.hash;
  }, [marketplaceContract, loadListings]);

  // Cancel a listing (seller only)
  const cancelListing = useCallback(async (listingId) => {
    if (!marketplaceContract) throw new Error('Marketplace not initialized');

    const tx = await marketplaceContract.cancelListing(listingId);
    await tx.wait();
    await loadListings();
    return tx.hash;
  }, [marketplaceContract, loadListings]);

  return {
    listings,
    isLoading,
    error,
    loadListings,
    createListing,
    buyListing,
    cancelListing,
  };
}
