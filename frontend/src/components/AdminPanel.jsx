import React, { useState, useEffect } from 'react';

export function AdminPanel({ 
  property, 
  isConnected, 
  account, 
  onDepositRent, 
  onRegisterProperty,
  onWithdrawProceeds,
  isLoading,
  checkIsAdmin 
}) {
  const [rentAmount, setRentAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regValue, setRegValue] = useState('');
  const [regShares, setRegShares] = useState('');
  const [regMinPurchase, setRegMinPurchase] = useState('1');
  const [regMaxPurchase, setRegMaxPurchase] = useState('0');
  const [isAdmin, setIsAdmin] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      console.log("AdminPanel - isConnected:", isConnected);
      console.log("AdminPanel - checkIsAdmin exists:", !!checkIsAdmin);
      if (isConnected && checkIsAdmin) {
        const adminStatus = await checkIsAdmin();
        console.log("AdminPanel - adminStatus:", adminStatus);
        setIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [isConnected, checkIsAdmin]);

  if (!isConnected) {
    return null; // Don't show admin panel if not connected
  }

  if (!isAdmin) {
    return (
      <div className="card p-6">
        <div className="text-center py-6 text-gray-500">
          <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-sm">Admin access required</p>
        </div>
      </div>
    );
  }

  // If admin but no property is loaded, show registration form
  if (!property) {
    const handleRegister = async () => {
      if (!regLocation || !regValue || !regShares) return;
      setTxStatus({ type: 'loading', message: 'Registering property...' });
      try {
        const valueWei = regValue; // Already in ETH, will be converted in App.jsx
        const result = await onRegisterProperty(regLocation, valueWei, regShares, regMinPurchase, regMaxPurchase);
        setTxStatus({ type: 'success', message: `Property created (ID: ${result.propertyId || '?'})` });
        setRegLocation('');
        setRegValue('');
        setRegShares('');
        setRegMinPurchase('1');
        setRegMaxPurchase('0');
        setTimeout(() => setTxStatus(null), 5000);
      } catch (err) {
        setTxStatus({ type: 'error', message: err.reason || err.message || 'Registration failed' });
        setTimeout(() => setTxStatus(null), 5000);
      }
    };

    return (
      <div className="card p-6 border-2 border-blue-200">
        <h3 className="text-lg font-semibold mb-4">Register New Property</h3>
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
        <div className="space-y-3">
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              value={regLocation}
              onChange={(e) => setRegLocation(e.target.value)}
              className="input w-full"
              placeholder="123 Main St, City"
            />
          </div>
          <div>
            <label className="label">Value (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={regValue}
              onChange={(e) => setRegValue(e.target.value)}
              className="input w-full"
              placeholder="100"
              min="0.001"
            />
          </div>
          <div>
            <label className="label">Total Shares</label>
            <input
              type="number"
              value={regShares}
              onChange={(e) => setRegShares(e.target.value)}
              className="input w-full"
              placeholder="1000"
              min="1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Min Purchase</label>
              <input
                type="number"
                value={regMinPurchase}
                onChange={(e) => setRegMinPurchase(e.target.value)}
                className="input w-full"
                placeholder="1"
                min="1"
              />
            </div>
            <div>
              <label className="label">Max Purchase (0=unlimited)</label>
              <input
                type="number"
                value={regMaxPurchase}
                onChange={(e) => setRegMaxPurchase(e.target.value)}
                className="input w-full"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <button
            onClick={handleRegister}
            disabled={!regLocation || !regValue || !regShares || isLoading}
            className="btn btn-primary w-full"
          >
            Register &amp; Fractionalize
          </button>
        </div>
      </div>
    );
  }

  const handleDepositRent = async () => {
    if (!rentAmount || parseFloat(rentAmount) <= 0) return;

    setTxStatus({ type: 'loading', message: 'Depositing rent...' });

    try {
      const txHash = await onDepositRent(property.propertyId, rentAmount);
      setTxStatus({ type: 'success', message: `Rent deposited! Tx: ${txHash.slice(0, 10)}...` });
      setRentAmount('');
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Deposit failed' });
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  const handleWithdraw = async () => {
    setTxStatus({ type: 'loading', message: 'Withdrawing proceeds...' });

    try {
      const txHash = await onWithdrawProceeds(property.propertyId, withdrawAmount || '0');
      setTxStatus({ type: 'success', message: `Proceeds withdrawn! Tx: ${txHash.slice(0, 10)}...` });
      setWithdrawAmount('');
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Withdrawal failed' });
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  return (
    <div className="card p-6 border-2 border-blue-200">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Admin Panel</h3>
          <p className="text-sm text-gray-500">Property management functions</p>
        </div>
        <span className="ml-auto px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          Admin
        </span>
      </div>

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

      {/* Deposit Rent Section */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Deposit Rental Income</h4>
        
        <div className="space-y-3">
          <div>
            <label className="label">Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              className="input"
              placeholder="0.00"
              min="0.001"
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Current Rent Pool:</span>
            <span>{property.rentPool} ETH</span>
          </div>

          {rentAmount && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>New Rent Pool:</span>
              <span>{(parseFloat(property.rentPool) + parseFloat(rentAmount)).toFixed(4)} ETH</span>
            </div>
          )}

          <button
            onClick={handleDepositRent}
            disabled={!rentAmount || parseFloat(rentAmount) <= 0 || isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <>
                <span className="spinner mr-2"></span>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Deposit Rent
              </>
            )}
          </button>
        </div>

        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Deposited rent is distributed proportionally to all shareholders based on their ownership percentage.
          </p>
        </div>
      </div>

      {/* Share Sale Proceeds Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-gray-900 mb-3">Share Sale Proceeds</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-600">Available to Withdraw:</span>
            <span className="text-2xl font-bold text-green-600">{property.shareSaleProceeds || '0'} ETH</span>
          </div>

          <div>
            <label className="label">Withdraw Amount (ETH) - Leave empty for all</label>
            <input
              type="number"
              step="0.001"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="input"
              placeholder="0 = withdraw all"
              min="0"
            />
          </div>

          <button
            onClick={handleWithdraw}
            disabled={parseFloat(property.shareSaleProceeds || 0) <= 0 || isLoading}
            className="btn w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="spinner mr-2"></span>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                Withdraw Proceeds
              </>
            )}
          </button>
        </div>

        <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>Note:</strong> Share sale proceeds come from investors buying shares. This is separate from the rent pool.
          </p>
        </div>
      </div>

      {/* Admin Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Admin Address:</strong> {account}
        </p>
      </div>
    </div>
  );
}
