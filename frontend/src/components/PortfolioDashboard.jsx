import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function PortfolioDashboard({ contract, account, isConnected, onViewDetails, onNavigateToProperty }) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState({});
  const [error, setError] = useState(null);

  const loadPortfolio = useCallback(async () => {
    if (!contract || !account) return;
    setLoading(true);
    setError(null);

    try {
      const total = await contract.getTotalProperties();
      const totalNum = total.toNumber();

      if (totalNum === 0) {
        setHoldings([]);
        return;
      }

      const results = [];

      for (let i = 1; i <= totalNum; i++) {
        try {
          const [prop, info] = await Promise.all([
            contract.getProperty(i),
            contract.getInvestorInfo(i, account),
          ]);

          if (info.sharesOwned.gt(0)) {
            const shareToken = new ethers.Contract(
              prop.shareToken,
              ['function getAvailableShares() view returns (uint256)'],
              contract.provider
            );
            const available = await shareToken.getAvailableShares();

            results.push({
              propertyId: i,
              shareToken: prop.shareToken,
              totalShares: prop.totalShares.toString(),
              availableShares: available.toString(),
              sharePrice: ethers.utils.formatEther(prop.sharePrice),
              rentPool: ethers.utils.formatEther(prop.rentPool),
              sharesOwned: info.sharesOwned.toString(),
              ownershipPct: (info.ownershipPercentage.toNumber() / 100).toFixed(2),
              pendingDividends: ethers.utils.formatEther(info.pendingDividends),
            });
          }
        } catch {
          // skip properties that fail (e.g. don't exist yet)
        }
      }

      setHoldings(results);
    } catch (err) {
      setError('Failed to load portfolio: ' + (err.reason || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    if (isConnected) loadPortfolio();
  }, [isConnected, loadPortfolio]);

  const handleClaim = async (propertyId) => {
    setClaiming(prev => ({ ...prev, [propertyId]: true }));
    try {
      const tx = await contract.claimDividends(propertyId);
      await tx.wait();
      await loadPortfolio();
    } catch (err) {
      console.error('Claim failed:', err);
    } finally {
      setClaiming(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const totalValue = holdings.reduce(
    (sum, h) => sum + parseFloat(h.sharesOwned) * parseFloat(h.sharePrice),
    0
  );
  const totalPending = holdings.reduce(
    (sum, h) => sum + parseFloat(h.pendingDividends),
    0
  );

  if (!isConnected) {
    return (
      <div className="card p-6 text-center py-16">
        <p className="text-gray-500">Connect your wallet to view your portfolio.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-16">
          <div className="spinner border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadPortfolio} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">Properties Invested</p>
          <p className="text-4xl font-bold text-gray-900">{holdings.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">Total Portfolio Value</p>
          <p className="text-4xl font-bold text-blue-600">{totalValue.toFixed(4)}</p>
          <p className="text-xs text-gray-400 mt-1">ETH (at current share prices)</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">Total Pending Dividends</p>
          <p className="text-4xl font-bold text-green-600">{totalPending.toFixed(6)}</p>
          <p className="text-xs text-gray-400 mt-1">ETH across all properties</p>
        </div>
      </div>

      {/* Holdings */}
      {holdings.length === 0 ? (
        <div className="card p-6 text-center py-16">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No investments yet</h3>
          <p className="text-gray-500 mb-6">
            Go to the Market tab, load a property, and buy shares to start building your portfolio.
          </p>
          <button onClick={() => onNavigateToProperty(null)} className="btn btn-primary">
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Holdings</h2>
            <button
              onClick={loadPortfolio}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {holdings.map((h) => (
            <div key={h.propertyId} className="card p-6">
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Property #{h.propertyId}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {h.shareToken.slice(0, 10)}...{h.shareToken.slice(-6)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewDetails(h.propertyId)}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onNavigateToProperty(h.propertyId)}
                    className="px-3 py-1.5 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Trade
                  </button>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-xs text-indigo-600 font-medium mb-0.5">Shares Owned</p>
                  <p className="text-xl font-bold text-indigo-900">{h.sharesOwned}</p>
                  <p className="text-xs text-indigo-500">of {h.totalShares}</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-3">
                  <p className="text-xs text-teal-600 font-medium mb-0.5">Ownership</p>
                  <p className="text-xl font-bold text-teal-900">{h.ownershipPct}%</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium mb-0.5">Value</p>
                  <p className="text-xl font-bold text-blue-900">
                    {(parseFloat(h.sharesOwned) * parseFloat(h.sharePrice)).toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-500">ETH</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium mb-0.5">Pending</p>
                  <p className="text-xl font-bold text-green-900">{parseFloat(h.pendingDividends).toFixed(6)}</p>
                  <p className="text-xs text-green-500">ETH dividends</p>
                </div>
              </div>

              {/* Claim button — only shown when there's something to claim */}
              {parseFloat(h.pendingDividends) > 0 && (
                <button
                  onClick={() => handleClaim(h.propertyId)}
                  disabled={!!claiming[h.propertyId]}
                  className="btn btn-primary w-full"
                >
                  {claiming[h.propertyId] ? (
                    <>
                      <span className="spinner mr-2 border-white"></span>
                      Claiming...
                    </>
                  ) : (
                    `Claim ${parseFloat(h.pendingDividends).toFixed(6)} ETH`
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
