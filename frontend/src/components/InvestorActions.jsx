import React, { useState } from 'react';

export function InvestorActions({ 
  property, 
  investorInfo, 
  isConnected, 
  onBuyShares, 
  onClaimDividends,
  onTransferShares,
  isLoading 
}) {
  const [sharesToBuy, setSharesToBuy] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
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

  const handleTransferShares = async () => {
    if (!transferTo || !transferAmount || transferAmount < 1) return;
    
    // Validate Ethereum address
    if (!transferTo.match(/^0x[a-fA-F0-9]{40}$/)) {
      setTxStatus({ type: 'error', message: 'Invalid Ethereum address' });
      setTimeout(() => setTxStatus(null), 5000);
      return;
    }

    setTxStatus({ type: 'loading', message: 'Transferring shares...' });
    
    try {
      const txHash = await onTransferShares(property.propertyId, transferTo, parseInt(transferAmount));
      setTxStatus({ type: 'success', message: `Shares transferred! Tx: ${txHash.slice(0, 10)}...` });
      setTransferAmount('');
      setTransferTo('');
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Transfer failed' });
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
              placeholder={`Max: ${property.availableShares || '?'}`}
              min={property.minPurchaseAmount || 1}
              max={property.maxPurchaseAmount > 0 ? property.maxPurchaseAmount : (property.availableShares || 1000)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {property.availableShares || '?'} shares
              {property.minPurchaseAmount > 1 && ` | Min: ${property.minPurchaseAmount}`}
              {property.maxPurchaseAmount > 0 && ` | Max per tx: ${property.maxPurchaseAmount}`}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Limit: Cannot buy more than 50% of available shares at once
            </p>
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

      {/* Transfer Shares Section */}
      {investorInfo?.sharesOwned > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-3">Transfer Shares</h4>
          
          <div className="space-y-3">
            <div>
              <label className="label">Recipient Address</label>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="input w-full"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="label">Amount to Transfer</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="input"
                placeholder={`Max: ${investorInfo?.sharesOwned || 0}`}
                min="1"
                max={investorInfo?.sharesOwned || 0}
              />
              <p className="text-xs text-gray-500 mt-1">
                You own: {investorInfo?.sharesOwned || 0} shares
              </p>
            </div>

            <button
              onClick={handleTransferShares}
              disabled={!transferTo || !transferAmount || transferAmount < 1 || transferAmount > (investorInfo?.sharesOwned || 0) || isLoading}
              className="btn w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="spinner mr-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Transfer Shares
                </>
              )}
            </button>

            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
              <strong>Note:</strong> This transfers shares directly to another address. No payment is processed.
            </div>
          </div>
        </div>
      )}

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
