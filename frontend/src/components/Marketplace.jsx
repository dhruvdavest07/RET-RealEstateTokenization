import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useMarketplace } from '../hooks/useMarketplace';

export function Marketplace({ marketplaceContract, contract, account, isConnected }) {
  const [activeTab, setActiveTab] = useState('browse');
  const [txStatus, setTxStatus] = useState(null);
  // Sell form state
  const [sellPropertyId, setSellPropertyId] = useState('');
  const [sellShares, setSellShares] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const { listings, isLoading, error, loadListings, createListing, buyListing, cancelListing } =
    useMarketplace(marketplaceContract, contract, account);

  useEffect(() => {
    if (marketplaceContract) loadListings();
  }, [marketplaceContract, loadListings]);

  const setStatus = (type, message) => {
    setTxStatus({ type, message });
    if (type !== 'loading') setTimeout(() => setTxStatus(null), 6000);
  };

  const handleBuy = async (listing) => {
    setStatus('loading', `Buying ${listing.shares} shares for ${listing.totalCostEth} ETH...`);
    try {
      const hash = await buyListing(listing.listingId, listing.shares, listing.pricePerShareWei);
      setStatus('success', `Bought! Tx: ${hash.slice(0, 10)}...`);
    } catch (err) {
      setStatus('error', err.reason || err.message || 'Buy failed');
    }
  };

  const handleCancel = async (listingId) => {
    setStatus('loading', 'Cancelling listing...');
    try {
      const hash = await cancelListing(listingId);
      setStatus('success', `Cancelled! Tx: ${hash.slice(0, 10)}...`);
    } catch (err) {
      setStatus('error', err.reason || err.message || 'Cancel failed');
    }
  };

  const handleCreateListing = async () => {
    if (!sellPropertyId || !sellShares || !sellPrice) return;
    setStatus('loading', 'Approving & listing shares...');
    try {
      const hash = await createListing(sellPropertyId, sellShares, sellPrice);
      setStatus('success', `Listed! Tx: ${hash.slice(0, 10)}...`);
      setSellPropertyId(''); setSellShares(''); setSellPrice('');
    } catch (err) {
      setStatus('error', err.reason || err.message || 'Listing failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="card p-6 text-center py-8 text-gray-500">
        <p>Connect your wallet to access the marketplace</p>
      </div>
    );
  }

  if (!marketplaceContract) {
    return (
      <div className="card p-6">
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
          <strong>Marketplace not deployed yet.</strong> Run <code>npm run deploy</code> and update{' '}
          <code>config.js</code> with the Marketplace address.
        </div>
      </div>
    );
  }

  const myListings = listings.filter(l => l.seller.toLowerCase() === account?.toLowerCase());
  const otherListings = listings.filter(l => l.seller.toLowerCase() !== account?.toLowerCase());

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Secondary Market</h3>
        <button
          onClick={loadListings}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Refresh listings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Status */}
      {txStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          txStatus.type === 'success' ? 'bg-green-100 text-green-800' :
          txStatus.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {txStatus.type === 'loading' && <span className="spinner border-current mr-2"></span>}
          {txStatus.message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {[
          { id: 'browse', label: `Browse (${otherListings.length})` },
          { id: 'mine', label: `My Listings (${myListings.length})` },
          { id: 'sell', label: 'Sell Shares' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner border-blue-600"></div>
              <span className="ml-2 text-gray-500 text-sm">Loading listings...</span>
            </div>
          ) : otherListings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No listings available. Be the first to list your shares!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {otherListings.map(listing => (
                <div key={listing.listingId} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900">Property #{listing.propertyId}</span>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {listing.shares} shares
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {listing.pricePerShare} ETH / share
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{listing.totalCostEth} ETH</p>
                      <button
                        onClick={() => handleBuy(listing)}
                        disabled={!!txStatus}
                        className="mt-2 btn btn-primary text-sm px-4 py-1.5 disabled:opacity-50"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Listings Tab */}
      {activeTab === 'mine' && (
        <div>
          {myListings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p>You have no active listings.</p>
              <button
                onClick={() => setActiveTab('sell')}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                List your shares
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map(listing => (
                <div key={listing.listingId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900">Property #{listing.propertyId}</span>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {listing.shares} shares @ {listing.pricePerShare} ETH each
                      </p>
                      <p className="text-sm font-medium text-blue-700">Total: {listing.totalCostEth} ETH</p>
                    </div>
                    <button
                      onClick={() => handleCancel(listing.listingId)}
                      disabled={!!txStatus}
                      className="btn text-sm px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sell Tab */}
      {activeTab === 'sell' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            List your shares for peer-to-peer sale. This is a two-step process:
            <br />1. Approve the Marketplace to transfer your shares
            <br />2. Create the listing — handled automatically.
          </div>

          <div>
            <label className="label">Property ID</label>
            <input
              type="number"
              value={sellPropertyId}
              onChange={e => setSellPropertyId(e.target.value)}
              className="input"
              placeholder="e.g. 1"
              min="1"
            />
          </div>

          <div>
            <label className="label">Number of Shares to List</label>
            <input
              type="number"
              value={sellShares}
              onChange={e => setSellShares(e.target.value)}
              className="input"
              placeholder="e.g. 10"
              min="1"
            />
          </div>

          <div>
            <label className="label">Price Per Share (ETH)</label>
            <input
              type="number"
              value={sellPrice}
              onChange={e => setSellPrice(e.target.value)}
              className="input"
              placeholder="e.g. 0.15"
              step="0.001"
              min="0.001"
            />
          </div>

          {sellShares && sellPrice && (
            <div className="flex justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <span>Total listing value:</span>
              <span className="font-semibold text-gray-900">
                {(parseFloat(sellShares || 0) * parseFloat(sellPrice || 0)).toFixed(4)} ETH
              </span>
            </div>
          )}

          <button
            onClick={handleCreateListing}
            disabled={!sellPropertyId || !sellShares || !sellPrice || !!txStatus}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {txStatus?.type === 'loading' ? (
              <><span className="spinner mr-2"></span>Processing...</>
            ) : 'Approve & List Shares'}
          </button>
        </div>
      )}
    </div>
  );
}
