import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const short = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—';

export function PropertyDetail({ propertyId, contract, account, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [events, setEvents] = useState({ rents: [], purchases: [], claims: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contract || !propertyId) return;
    loadAll();
  }, [contract, propertyId]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const prop = await contract.getProperty(propertyId);

      const shareToken = new ethers.Contract(
        prop.shareToken,
        ['function getAvailableShares() view returns (uint256)'],
        contract.provider
      );
      const available = await shareToken.getAvailableShares();

      setData({
        propertyId,
        shareToken: prop.shareToken,
        totalShares: prop.totalShares.toString(),
        availableShares: available.toString(),
        soldShares: (prop.totalShares.toNumber() - available.toNumber()).toString(),
        sharePrice: ethers.utils.formatEther(prop.sharePrice),
        rentPool: ethers.utils.formatEther(prop.rentPool),
        shareSaleProceeds: ethers.utils.formatEther(prop.shareSaleProceeds || 0),
        propertyValue: (
          parseFloat(ethers.utils.formatEther(prop.sharePrice)) * prop.totalShares.toNumber()
        ).toFixed(4),
        soldPct: ((prop.totalShares.toNumber() - available.toNumber()) / prop.totalShares.toNumber() * 100).toFixed(1),
      });

      // Fetch all 3 event types in parallel
      const [rentLogs, purchaseLogs, claimLogs] = await Promise.all([
        contract.queryFilter(contract.filters.RentDeposited(propertyId), 0, 'latest'),
        contract.queryFilter(contract.filters.SharesPurchased(propertyId), 0, 'latest'),
        contract.queryFilter(contract.filters.DividendsClaimed(propertyId), 0, 'latest'),
      ]);

      setEvents({
        rents: [...rentLogs].reverse().map(e => ({
          block: e.blockNumber,
          tx: e.transactionHash,
          depositor: e.args.depositor,
          amount: ethers.utils.formatEther(e.args.amount),
          newRentPool: ethers.utils.formatEther(e.args.newRentPool),
        })),
        purchases: [...purchaseLogs].reverse().map(e => ({
          block: e.blockNumber,
          tx: e.transactionHash,
          buyer: e.args.buyer,
          amount: e.args.amount.toString(),
          cost: ethers.utils.formatEther(e.args.cost),
        })),
        claims: [...claimLogs].reverse().map(e => ({
          block: e.blockNumber,
          tx: e.transactionHash,
          investor: e.args.investor,
          amount: ethers.utils.formatEther(e.args.amount),
        })),
      });
    } catch (err) {
      console.error('PropertyDetail error:', err);
      setError(err.reason || err.message || 'Failed to load property data');
    } finally {
      setLoading(false);
    }
  };

  const historyCount = events.rents.length + events.purchases.length + events.claims.length;
  const myPurchases = events.purchases.filter(e => account && e.buyer.toLowerCase() === account.toLowerCase());
  const myClaims = events.claims.filter(e => account && e.investor.toLowerCase() === account.toLowerCase());
  const myTotalClaimed = myClaims.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Property #{propertyId}</h2>
            {data && (
              <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">
                Share Token: {data.shareToken}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'history', label: `History (${historyCount})` },
            { id: 'activity', label: `My Activity (${myPurchases.length + myClaims.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="spinner border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={loadAll} className="btn btn-primary">Retry</button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* ── OVERVIEW ── */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-blue-600 font-medium mb-1">Total Shares</p>
                      <p className="text-2xl font-bold text-blue-900">{data.totalShares}</p>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-xs text-teal-600 font-medium mb-1">Available</p>
                      <p className="text-2xl font-bold text-teal-900">{data.availableShares}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <p className="text-xs text-indigo-600 font-medium mb-1">Sold</p>
                      <p className="text-2xl font-bold text-indigo-900">{data.soldShares}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-green-600 font-medium mb-1">Share Price</p>
                      <p className="text-2xl font-bold text-green-900">{data.sharePrice}</p>
                      <p className="text-xs text-green-600">ETH</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs text-purple-600 font-medium mb-1">Rent Pool</p>
                      <p className="text-2xl font-bold text-purple-900">{data.rentPool}</p>
                      <p className="text-xs text-purple-600">ETH</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-xs text-orange-600 font-medium mb-1">Property Value</p>
                      <p className="text-2xl font-bold text-orange-900">{data.propertyValue}</p>
                      <p className="text-xs text-orange-600">ETH</p>
                    </div>
                  </div>

                  {/* Sold-out progress bar */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Share Distribution</span>
                      <span>{data.soldPct}% sold</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${data.soldPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{data.soldShares} sold</span>
                      <span>{data.availableShares} available</span>
                    </div>
                  </div>

                  {/* Share token address */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-medium mb-1">Share Token Contract (ERC-20)</p>
                    <p className="text-sm font-mono text-gray-800 break-all">{data.shareToken}</p>
                  </div>

                  {/* Transaction summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{events.rents.length}</p>
                      <p className="text-xs text-gray-500">Rent deposits</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{events.purchases.length}</p>
                      <p className="text-xs text-gray-500">Share purchases</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{events.claims.length}</p>
                      <p className="text-xs text-gray-500">Dividend claims</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── HISTORY ── */}
              {activeTab === 'history' && (
                <div className="space-y-8">

                  {/* Rent deposits */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Rent Deposits ({events.rents.length})
                    </h3>
                    {events.rents.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No rent deposited yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {events.rents.map((e, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div>
                              <p className="text-sm font-semibold text-purple-900">{e.amount} ETH deposited</p>
                              <p className="text-xs text-purple-500">
                                By {short(e.depositor)} · Block #{e.block}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-purple-500">Rent pool after</p>
                              <p className="text-sm font-semibold text-purple-900">{e.newRentPool} ETH</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Share purchases */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Share Purchases ({events.purchases.length})
                    </h3>
                    {events.purchases.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No shares purchased yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {events.purchases.map((e, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="text-sm font-semibold text-blue-900">{e.amount} shares</p>
                              <p className="text-xs text-blue-500">
                                {short(e.buyer)} · Block #{e.block}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-blue-900">{e.cost} ETH</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Dividend claims */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Dividend Claims ({events.claims.length})
                    </h3>
                    {events.claims.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No dividends claimed yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {events.claims.map((e, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="text-sm font-semibold text-green-900">{e.amount} ETH claimed</p>
                              <p className="text-xs text-green-500">
                                {short(e.investor)} · Block #{e.block}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* ── MY ACTIVITY ── */}
              {activeTab === 'activity' && (
                <div className="space-y-8">
                  {!account ? (
                    <p className="text-gray-500 text-center py-12">Connect your wallet to see your activity.</p>
                  ) : (
                    <>
                      {/* My purchases */}
                      <section>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                          My Purchases ({myPurchases.length})
                        </h3>
                        {myPurchases.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">You haven't bought shares in this property.</p>
                        ) : (
                          <>
                            <div className="space-y-2 mb-3">
                              {myPurchases.map((e, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                  <div>
                                    <p className="text-sm font-semibold text-blue-900">{e.amount} shares</p>
                                    <p className="text-xs text-blue-500">Block #{e.block}</p>
                                  </div>
                                  <p className="text-sm font-semibold text-blue-900">{e.cost} ETH</p>
                                </div>
                              ))}
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg flex justify-between text-sm">
                              <span className="text-gray-600">Total invested</span>
                              <span className="font-semibold text-gray-900">
                                {myPurchases.reduce((sum, e) => sum + parseFloat(e.cost), 0).toFixed(4)} ETH
                              </span>
                            </div>
                          </>
                        )}
                      </section>

                      {/* My dividend claims */}
                      <section>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                          My Dividend Claims ({myClaims.length})
                        </h3>
                        {myClaims.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">You haven't claimed any dividends yet.</p>
                        ) : (
                          <>
                            <div className="space-y-2 mb-3">
                              {myClaims.map((e, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                  <p className="text-sm font-semibold text-green-900">{e.amount} ETH</p>
                                  <p className="text-xs text-green-500">Block #{e.block}</p>
                                </div>
                              ))}
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg flex justify-between text-sm">
                              <span className="text-gray-600">Total claimed</span>
                              <span className="font-semibold text-gray-900">
                                {myTotalClaimed.toFixed(6)} ETH
                              </span>
                            </div>
                          </>
                        )}
                      </section>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
