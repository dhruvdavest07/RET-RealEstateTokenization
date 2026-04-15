import React, { useState, useEffect } from 'react';

export function AdminPanel({
  property,
  isConnected,
  account,
  contract,
  onDepositRent,
  onRegisterProperty,
  onWithdrawProceeds,
  onUpdatePropertyValue,
  onSetWhitelistEnabled,
  onAddToWhitelist,
  onRemoveFromWhitelist,
  onAddBatchToWhitelist,
  onInitiatePropertySale,
  whitelistActive,
  isLoading,
  checkIsAdmin,
}) {
  const [rentAmount, setRentAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regValue, setRegValue] = useState('');
  const [regShares, setRegShares] = useState('');
  const [regMinPurchase, setRegMinPurchase] = useState('1');
  const [regMaxPurchase, setRegMaxPurchase] = useState('0');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [txStatus, setTxStatus] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showUpdateValue, setShowUpdateValue] = useState(false);
  const [showWhitelist, setShowWhitelist] = useState(false);
  const [showPropertySale, setShowPropertySale] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [wlAddress, setWlAddress] = useState('');
  const [salePrice, setSalePrice] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      setIsCheckingAdmin(true);
      if (isConnected && checkIsAdmin) {
        const adminStatus = await checkIsAdmin();
        setIsAdmin(adminStatus);
      }
      setIsCheckingAdmin(false);
    };
    checkAdmin();
  }, [isConnected, checkIsAdmin]);

  if (!isConnected) {
    return null; // Don't show admin panel if not connected
  }

  if (isCheckingAdmin) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-6 text-gray-400">
          <span className="spinner border-gray-400 mr-2"></span>
          <p className="text-sm">Checking access...</p>
        </div>
      </div>
    );
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

  const handleRegister = async () => {
    if (!regLocation || !regValue || !regShares) return;
    setTxStatus({ type: 'loading', message: 'Registering property...' });
    try {
      const result = await onRegisterProperty(regLocation, regValue, regShares, regMinPurchase, regMaxPurchase);
      setTxStatus({ type: 'success', message: `Property created (ID: ${result.propertyId || '?'})` });
      setRegLocation('');
      setRegValue('');
      setRegShares('');
      setRegMinPurchase('1');
      setRegMaxPurchase('0');
      setShowRegisterForm(false);
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Registration failed' });
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  const registerFormContent = (
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
  );

  // If no property loaded, show only the registration form
  if (!property) {
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
        {registerFormContent}
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

      {/* Update Property Value (collapsible) */}
      <div className="mt-4">
        <button
          onClick={() => setShowUpdateValue(v => !v)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <span>Update Property Value</span>
          <svg className={`w-4 h-4 transition-transform ${showUpdateValue ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showUpdateValue && (
          <div className="mt-3 p-4 border border-gray-200 rounded-lg space-y-3">
            <p className="text-xs text-gray-500">
              Recalculates the share price as <code>newValue / totalShares</code>.
              Does not affect existing balances or dividends.
            </p>
            <div>
              <label className="label">New Property Value (ETH)</label>
              <input
                type="number"
                step="0.001"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="input w-full"
                placeholder="e.g. 150"
                min="0.001"
              />
            </div>
            {newValue && property && (
              <p className="text-xs text-blue-600">
                New share price: {(parseFloat(newValue) / parseInt(property.totalShares)).toFixed(6)} ETH
                {' '}(was {property.sharePrice} ETH)
              </p>
            )}
            <button
              onClick={async () => {
                if (!newValue) return;
                setTxStatus({ type: 'loading', message: 'Updating value...' });
                try {
                  await onUpdatePropertyValue(property.propertyId, newValue);
                  setTxStatus({ type: 'success', message: 'Property value updated!' });
                  setNewValue('');
                  setShowUpdateValue(false);
                  setTimeout(() => setTxStatus(null), 5000);
                } catch (err) {
                  setTxStatus({ type: 'error', message: err.reason || err.message || 'Update failed' });
                  setTimeout(() => setTxStatus(null), 5000);
                }
              }}
              disabled={!newValue || isLoading}
              className="btn btn-primary w-full"
            >
              Update Value
            </button>
          </div>
        )}
      </div>

      {/* Whitelist Management (collapsible) */}
      <div className="mt-4">
        <button
          onClick={() => setShowWhitelist(v => !v)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span>KYC Whitelist</span>
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${whitelistActive ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'}`}>
              {whitelistActive ? 'ON' : 'OFF'}
            </span>
          </div>
          <svg className={`w-4 h-4 transition-transform ${showWhitelist ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showWhitelist && (
          <div className="mt-3 p-4 border border-gray-200 rounded-lg space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Require KYC to buy shares</p>
                <p className="text-xs text-gray-500">When ON, only whitelisted addresses can buy shares</p>
              </div>
              <button
                onClick={async () => {
                  setTxStatus({ type: 'loading', message: `${whitelistActive ? 'Disabling' : 'Enabling'} whitelist...` });
                  try {
                    await onSetWhitelistEnabled(!whitelistActive);
                    setTxStatus(null);
                  } catch (err) {
                    setTxStatus({ type: 'error', message: err.reason || err.message || 'Failed' });
                    setTimeout(() => setTxStatus(null), 5000);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${whitelistActive ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${whitelistActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Add single address */}
            <div className="space-y-2">
              <label className="label">Add investor address</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={wlAddress}
                  onChange={e => setWlAddress(e.target.value)}
                  className="input flex-1 text-xs"
                  placeholder="0x..."
                />
                <button
                  onClick={async () => {
                    if (!wlAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                      setTxStatus({ type: 'error', message: 'Invalid address' });
                      setTimeout(() => setTxStatus(null), 3000);
                      return;
                    }
                    setTxStatus({ type: 'loading', message: 'Whitelisting...' });
                    try {
                      await onAddToWhitelist(wlAddress);
                      setWlAddress('');
                      setTxStatus({ type: 'success', message: 'Address whitelisted!' });
                      setTimeout(() => setTxStatus(null), 3000);
                    } catch (err) {
                      setTxStatus({ type: 'error', message: err.reason || err.message || 'Failed' });
                      setTimeout(() => setTxStatus(null), 5000);
                    }
                  }}
                  disabled={isLoading}
                  className="btn btn-primary text-sm px-3"
                >
                  Add
                </button>
                <button
                  onClick={async () => {
                    if (!wlAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                      setTxStatus({ type: 'error', message: 'Invalid address' });
                      setTimeout(() => setTxStatus(null), 3000);
                      return;
                    }
                    setTxStatus({ type: 'loading', message: 'Removing...' });
                    try {
                      await onRemoveFromWhitelist(wlAddress);
                      setWlAddress('');
                      setTxStatus({ type: 'success', message: 'Address removed.' });
                      setTimeout(() => setTxStatus(null), 3000);
                    } catch (err) {
                      setTxStatus({ type: 'error', message: err.reason || err.message || 'Failed' });
                      setTimeout(() => setTxStatus(null), 5000);
                    }
                  }}
                  disabled={isLoading}
                  className="btn text-sm px-3 border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Batch whitelist all demo accounts */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Quick add — all demo investor accounts:</p>
              <button
                onClick={async () => {
                  const demoInvestors = [
                    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
                  ];
                  setTxStatus({ type: 'loading', message: 'Whitelisting 3 demo accounts...' });
                  try {
                    await onAddBatchToWhitelist(demoInvestors);
                    setTxStatus({ type: 'success', message: 'All 3 demo investors whitelisted!' });
                    setTimeout(() => setTxStatus(null), 5000);
                  } catch (err) {
                    setTxStatus({ type: 'error', message: err.reason || err.message || 'Batch failed' });
                    setTimeout(() => setTxStatus(null), 5000);
                  }
                }}
                disabled={isLoading}
                className="btn w-full text-sm border border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Whitelist all 3 demo investors
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Property Sale / Exit (collapsible) — Phase 3 */}
      {!property?.sold && (
        <div className="mt-4">
          <button
            onClick={() => setShowPropertySale(v => !v)}
            className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-700 transition-colors border border-red-200"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Initiate Property Sale</span>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showPropertySale ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showPropertySale && (
            <div className="mt-3 p-4 border border-red-200 rounded-lg bg-red-50 space-y-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <p className="text-xs text-red-800 font-medium">This action is irreversible.</p>
                <p className="text-xs text-red-700 mt-1">
                  When initiated: share purchases are permanently blocked, and investors can redeem
                  their shares for a proportional payout of the sale proceeds you send.
                </p>
              </div>
              <div>
                <label className="label">Total Sale Price (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. 120"
                  min="0.001"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You must send this exact amount of ETH with the transaction.
                </p>
              </div>
              {salePrice && property && (
                <div className="p-2 bg-white rounded text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Payout per share:</span>
                    <span className="font-medium">{(parseFloat(salePrice) / parseInt(property.totalShares)).toFixed(6)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total shares:</span>
                    <span className="font-medium">{property.totalShares}</span>
                  </div>
                </div>
              )}
              <button
                onClick={async () => {
                  if (!salePrice || parseFloat(salePrice) <= 0) return;
                  const confirmed = window.confirm(
                    `Initiate sale for Property #${property.propertyId} at ${salePrice} ETH?\n\nThis CANNOT be undone. You will send ${salePrice} ETH which investors can redeem proportionally.`
                  );
                  if (!confirmed) return;
                  setTxStatus({ type: 'loading', message: 'Initiating property sale...' });
                  try {
                    const hash = await onInitiatePropertySale(property.propertyId, salePrice);
                    setTxStatus({ type: 'success', message: `Sale initiated! Tx: ${hash.slice(0, 10)}...` });
                    setSalePrice('');
                    setShowPropertySale(false);
                    setTimeout(() => setTxStatus(null), 6000);
                  } catch (err) {
                    setTxStatus({ type: 'error', message: err.reason || err.message || 'Sale initiation failed' });
                    setTimeout(() => setTxStatus(null), 6000);
                  }
                }}
                disabled={!salePrice || parseFloat(salePrice) <= 0 || isLoading}
                className="btn w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                Confirm Property Sale
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sold notice */}
      {property?.sold && (
        <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏷️</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">Property Sold</p>
              <p className="text-xs text-gray-500">
                Sale proceeds: {property.saleProceeds} ETH. Investors can claim via "Claim Sale Proceeds".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Register New Property (collapsible) */}
      <div className="mt-6">
        <button
          onClick={() => setShowRegisterForm((v) => !v)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <span>Register New Property</span>
          <svg
            className={`w-4 h-4 transition-transform ${showRegisterForm ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showRegisterForm && (
          <div className="mt-3 p-4 border border-gray-200 rounded-lg">
            {registerFormContent}
          </div>
        )}
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
