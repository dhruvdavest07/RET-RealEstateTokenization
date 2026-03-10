import React, { useState } from 'react';

export function InvestorActions({ 
  property, 
  investorInfo, 
  isConnected, 
  onBuyShares, 
  onClaimDividends,
  isLoading 
}) {
  const [sharesToBuy, setSharesToBuy] = useState('');
  const [txStatus, setTxStatus] = useState(null);

  if (!isConnected) {
    return (
      <div className="card p-6">
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p>Connect your wallet to access investor features</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="card p-6">
        <div className="text-center py-8 text-gray-500">
          <p>Load a property to see investor actions</p>
        </div>
      </div>
    );
  }

  const handleBuyShares = async () => {
    if (!sharesToBuy || sharesToBuy < 1) return;
    
    setTxStatus({ type: 'loading', message: 'Buying shares...' });
    
    try {
      const txHash = await onBuyShares(property.propertyId, parseInt(sharesToBuy), property.sharePrice);
      setTxStatus({ type: 'success', message: `Shares purchased! Tx: ${txHash.slice(0, 10)}...` });
      setSharesToBuy('');
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Transaction failed' });
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  const handleClaimDividends = async () => {
    setTxStatus({ type: 'loading', message: 'Claiming dividends...' });
    
    try {
      const txHash = await onClaimDividends(property.propertyId);
      setTxStatus({ type: 'success', message: `Dividends claimed! Tx: ${txHash.slice(0, 10)}...` });
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Claim failed' });
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  const totalCost = sharesToBuy ? (parseFloat(sharesToBuy) * parseFloat(property.sharePrice)).toFixed(4) : '0';

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Investor Actions</h3>

      {/* Status Message */}
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

      {/* Buy Shares Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Buy Shares</h4>
        
        <div className="space-y-3">
          <div>
            <label className="label">Number of Shares</label>
            <input
              type="number"
              value={sharesToBuy}
              onChange={(e) => setSharesToBuy(e.target.value)}
              className="input"
              placeholder="Enter amount"
              min="1"
              max="1000"
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Share Price:</span>
            <span>{property.sharePrice} ETH</span>
          </div>

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total Cost:</span>
            <span>{totalCost} ETH</span>
          </div>

          <button
            onClick={handleBuyShares}
            disabled={!sharesToBuy || sharesToBuy < 1 || isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <>
                <span className="spinner mr-2"></span>
                Processing...
              </>
            ) : (
              'Buy Shares'
            )}
          </button>
        </div>
      </div>

      {/* Claim Dividends Section */}
      <div className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Claim Dividends</h4>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Available to claim:</span>
          <span className="text-2xl font-bold text-rose-600">
            {investorInfo?.pendingDividends || '0'} ETH
          </span>
        </div>

        <button
          onClick={handleClaimDividends}
          disabled={!investorInfo?.pendingDividends || parseFloat(investorInfo.pendingDividends) === 0 || isLoading}
          className="btn btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="spinner mr-2"></span>
              Processing...
            </>
          ) : (
            'Claim Dividends'
          )}
        </button>

        {investorInfo?.pendingDividends && parseFloat(investorInfo.pendingDividends) > 0 && (
          <p className="mt-2 text-xs text-center text-gray-500">
            Based on your {investorInfo.sharesOwned} shares ownership
          </p>
        )}
      </div>
    </div>
  );
}
