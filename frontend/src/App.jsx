import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './hooks/useWeb3';
import { useProperty } from './hooks/useProperty';
import { Header } from './components/Header';
import { PropertyDashboard } from './components/PropertyDashboard';
import { InvestorActions } from './components/InvestorActions';
import { AdminPanel } from './components/AdminPanel';

function App() {
  const [propertyId, setPropertyId] = useState('1');
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState(null);

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
    depositRent,
    checkIsAdmin,
    registerProperty,
    withdrawShareSaleProceeds,
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

  const handleDepositRent = async (propId, amount) => {
    const result = await depositRent(propId, amount);
    showToast('Rent deposited successfully!', 'success');
    return result;
  };

  const handleRegisterProperty = async (location, valueEth, totalShares, minPurchase = 1, maxPurchase = 0) => {
    // convert value to wei
    const valueWei = ethers.utils.parseEther(valueEth);
    const { txHash, propertyId: newId } = await registerProperty(location, valueWei, totalShares, minPurchase, maxPurchase);
    showToast(`Property registered! ID: ${newId || '(unknown)'} Tx: ${txHash.slice(0, 10)}...`, 'success');

    // automatically load the new property if we know its id
    if (newId) {
      setPropertyId(newId);
      loadProperty(newId);
    }

    return { txHash, propertyId: newId };
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
            {isAdmin && (
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                Admin Mode
              </span>
            )}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Dashboard - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PropertyDashboard
              property={property}
              investorInfo={investorInfo}
              isLoading={propertyLoading}
              onRefresh={handleRefresh}
            />
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <InvestorActions
              property={property}
              investorInfo={investorInfo}
              isConnected={isConnected}
              onBuyShares={handleBuyShares}
              onClaimDividends={handleClaimDividends}
              isLoading={propertyLoading}
            />

            <AdminPanel
              property={property}
              isConnected={isConnected}
              account={account}
              onDepositRent={handleDepositRent}
              onRegisterProperty={handleRegisterProperty}
              onWithdrawProceeds={handleWithdrawProceeds}
              isLoading={propertyLoading}
              checkIsAdmin={checkIsAdmin}
            />
          </div>
        </div>

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
