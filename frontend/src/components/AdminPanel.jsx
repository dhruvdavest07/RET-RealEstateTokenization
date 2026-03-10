import React, { useState, useEffect } from 'react';

export function AdminPanel({ 
  property, 
  isConnected, 
  account, 
  onDepositRent, 
  isLoading,
  checkIsAdmin 
}) {
  const [rentAmount, setRentAmount] = useState('');
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

  if (!property) {
    return (
      <div className="card p-6">
        <div className="text-center py-8 text-gray-500">
          <p>Load a property to access admin features</p>
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

      {/* Admin Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Admin Address:</strong> {account}
        </p>
      </div>
    </div>
  );
}
