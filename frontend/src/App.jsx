import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './hooks/useWeb3';
import { useProperty } from './hooks/useProperty';
import { Header } from './components/Header';
import { PropertyDashboard } from './components/PropertyDashboard';
import { InvestorActions } from './components/InvestorActions';
import { AdminPanel } from './components/AdminPanel';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { PropertyDetail } from './components/PropertyDetail';

function App() {
  const [propertyId, setPropertyId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('market');
  const [detailPropertyId, setDetailPropertyId] = useState(null);
  const [whitelistActive, setWhitelistActive] = useState(false);
  const [investorWhitelisted, setInvestorWhitelisted] = useState(false);

  const {
    account,
    isConnected,
    isConnecting,
    error: web3Error,
    chainId,
    connectWallet,
    disconnect,
    contract,
  } = useWeb3();

  const {
    property,
    investorInfo,
    isLoading: propertyLoading,
    error: propertyError,
    loadProperty,
    loadInvestorInfo,
    buyShares,
    claimDividends,
    reinvestDividends,
    depositRent,
    transferShares,
    checkIsAdmin,
    registerProperty,
    withdrawShareSaleProceeds,
    updatePropertyValue,
    setWhitelistEnabled,
    addToWhitelist,
    removeFromWhitelist,
    addBatchToWhitelist,
  } = useProperty(contract, account);

  // Check admin status when connected
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isConnected && checkIsAdmin) {
        const admin = await checkIsAdmin();
        setIsAdmin(admin);
      }
    };
    checkAdminStatus();
  }, [isConnected, checkIsAdmin, account]);

  // Sync whitelist state whenever contract or account changes
  useEffect(() => {
    const syncWhitelist = async () => {
      if (!contract || !account) return;
      try {
        const enabled = await contract.whitelistEnabled();
        setWhitelistActive(enabled);
        const wl = await contract.whitelisted(account);
        setInvestorWhitelisted(wl);
      } catch {
        // contract may not have these functions on old deployments
      }
    };
    syncWhitelist();
  }, [contract, account]);

  // Load property on mount and when propertyId changes
  useEffect(() => {
    if (contract && propertyId) {
      loadProperty(propertyId);
    }
  }, [contract, propertyId, loadProperty]);

  // Refresh investor info periodically
  useEffect(() => {
    if (!contract || !account || !propertyId) return;

    const interval = setInterval(() => {
      loadInvestorInfo(propertyId, account);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [contract, account, propertyId, loadInvestorInfo]);

  // Show error toast
  useEffect(() => {
    if (web3Error || propertyError) {
      showToast(web3Error || propertyError, 'error');
    }
  }, [web3Error, propertyError]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleRefresh = useCallback((id) => {
    setPropertyId(id);
    loadProperty(id);
  }, [loadProperty]);

  const handleBuyShares = async (propId, amount, sharePrice) => {
    const result = await buyShares(propId, amount, sharePrice);
    showToast('Shares purchased successfully!', 'success');
    return result;
  };

  const handleClaimDividends = async (propId) => {
    const result = await claimDividends(propId);
    showToast('Dividends claimed successfully!', 'success');
    return result;
  };

  const handleTransferShares = async (propId, to, amount) => {
    const result = await transferShares(propId, to, amount);
    showToast('Shares transferred successfully!', 'success');
    return result;
  };

  const handleDepositRent = async (propId, amount) => {
    const result = await depositRent(propId, amount);
    showToast('Rent deposited successfully!', 'success');
    return result;
  };

  const handleRegisterProperty = async (location, valueEth, totalShares, minPurchase = 1, maxPurchase = 0) => {
    const valueWei = ethers.utils.parseEther(valueEth);
    const { txHash, propertyId: newId } = await registerProperty(location, valueWei, totalShares, minPurchase, maxPurchase);
    showToast(`Property registered! ID: ${newId || '(unknown)'}`, 'success');

    if (newId) {
      setPropertyId(newId);
      loadProperty(newId);
    }

    return { txHash, propertyId: newId };
  };

  const handleReinvestDividends = async (propId) => {
    const result = await reinvestDividends(propId);
    showToast('Dividends reinvested as shares!', 'success');
    return result;
  };

  const handleUpdatePropertyValue = async (propId, valueEth) => {
    const result = await updatePropertyValue(propId, valueEth);
    showToast('Property value updated!', 'success');
    return result;
  };

  const handleSetWhitelistEnabled = async (enabled) => {
    await setWhitelistEnabled(enabled);
    setWhitelistActive(enabled);
    showToast(`Whitelist ${enabled ? 'enabled' : 'disabled'}`, 'success');
  };

  const handleAddToWhitelist = async (investor) => {
    await addToWhitelist(investor);
    if (investor.toLowerCase() === account?.toLowerCase()) setInvestorWhitelisted(true);
    showToast(`${investor.slice(0, 10)}... whitelisted`, 'success');
  };

  const handleRemoveFromWhitelist = async (investor) => {
    await removeFromWhitelist(investor);
    if (investor.toLowerCase() === account?.toLowerCase()) setInvestorWhitelisted(false);
    showToast(`${investor.slice(0, 10)}... removed from whitelist`, 'success');
  };

  const handleAddBatchToWhitelist = async (investors) => {
    await addBatchToWhitelist(investors);
    if (investors.map(a => a.toLowerCase()).includes(account?.toLowerCase())) {
      setInvestorWhitelisted(true);
    }
    showToast(`${investors.length} addresses whitelisted`, 'success');
  };

  const handleNavigateToProperty = (id) => {
    setActiveTab('market');
    if (id) {
      setPropertyId(String(id));
      loadProperty(String(id));
    }
  };

  const handleWithdrawProceeds = async (propId, amount) => {
    const result = await withdrawShareSaleProceeds(propId, amount);
    showToast('Share sale proceeds withdrawn successfully!', 'success');
    return result;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        account={account}
        isConnected={isConnected}
        isConnecting={isConnecting}
        connectWallet={connectWallet}
        disconnect={disconnect}
        chainId={chainId}
      />

      {/* Tab Navigation */}
      {isConnected && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-0">
              {[
                { id: 'market', label: 'Market' },
                { id: 'portfolio', label: 'My Portfolio' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        {!isConnected && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome to TokenIT</h2>
            <p className="text-blue-100 mb-4">
              A blockchain-based Real Estate Investment Trust platform. 
              Connect your MetaMask wallet to start investing in tokenized properties.
            </p>
            <div className="flex items-center space-x-4 text-sm text-blue-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Buy property shares
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Earn rental income
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Claim dividends
              </div>
            </div>
          </div>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {isConnected && activeTab === 'portfolio' && (
          <PortfolioDashboard
            contract={contract}
            account={account}
            isConnected={isConnected}
            onViewDetails={(id) => setDetailPropertyId(id)}
            onNavigateToProperty={handleNavigateToProperty}
          />
        )}

        {/* ── MARKET TAB ── */}
        {(!isConnected || activeTab === 'market') && (
          <>
            {/* Property Selector */}
            {isConnected && (
              <div className="mb-6 flex items-center space-x-4">
                <label className="font-medium text-gray-700">Property ID:</label>
                <input
                  type="number"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="input w-32"
                  min="1"
                />
                <button
                  onClick={() => handleRefresh(propertyId)}
                  className="btn btn-primary"
                >
                  Load Property
                </button>
                {property && (
                  <button
                    onClick={() => setDetailPropertyId(parseInt(propertyId))}
                    className="btn border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
                  >
                    View Details
                  </button>
                )}
                {isAdmin && (
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    Admin Mode
                  </span>
                )}
              </div>
            )}

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PropertyDashboard
                  property={property}
                  investorInfo={investorInfo}
                  isLoading={propertyLoading}
                  onRefresh={handleRefresh}
                />
              </div>
              <div className="space-y-6">
                <InvestorActions
                  property={property}
                  investorInfo={investorInfo}
                  isConnected={isConnected}
                  onBuyShares={handleBuyShares}
                  onClaimDividends={handleClaimDividends}
                  onReinvestDividends={handleReinvestDividends}
                  onTransferShares={handleTransferShares}
                  isLoading={propertyLoading}
                  whitelistEnabled={whitelistActive}
                  isWhitelisted={investorWhitelisted}
                  contract={contract}
                  account={account}
                />
                <AdminPanel
                  property={property}
                  isConnected={isConnected}
                  account={account}
                  contract={contract}
                  onDepositRent={handleDepositRent}
                  onRegisterProperty={handleRegisterProperty}
                  onWithdrawProceeds={handleWithdrawProceeds}
                  onUpdatePropertyValue={handleUpdatePropertyValue}
                  onSetWhitelistEnabled={handleSetWhitelistEnabled}
                  onAddToWhitelist={handleAddToWhitelist}
                  onRemoveFromWhitelist={handleRemoveFromWhitelist}
                  onAddBatchToWhitelist={handleAddBatchToWhitelist}
                  whitelistActive={whitelistActive}
                  isLoading={propertyLoading}
                  checkIsAdmin={checkIsAdmin}
                />
              </div>
            </div>
          </>
        )}

        {/* Instructions for Demo */}
        {isConnected && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Demo Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">1. Buy Shares</h4>
                <p>Enter the number of shares you want to purchase and click "Buy Shares". The cost will be calculated automatically.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">2. Wait for Rent</h4>
                <p>The admin will deposit rental income into the property's rent pool, which is distributed to shareholders.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">3. Claim Dividends</h4>
                <p>Once rent is deposited, your pending dividends will appear. Click "Claim Dividends" to receive your share.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Property Detail Modal */}
      {detailPropertyId && (
        <PropertyDetail
          propertyId={detailPropertyId}
          contract={contract}
          account={account}
          onClose={() => setDetailPropertyId(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>TokenIT - Blockchain REIT Platform</p>
            <p>University Project Demo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
