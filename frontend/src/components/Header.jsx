import React from 'react';

export function Header({ account, isConnected, isConnecting, connectWallet, disconnect, chainId }) {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (id) => {
    switch (id) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 31337: return 'Hardhat Local';
      case 1337: return 'Hardhat Local';
      default: return `Chain ${id}`;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">TokenIT</h1>
              <p className="text-xs text-gray-500">Blockchain REIT Platform</p>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Network Badge */}
                <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                  {getNetworkName(chainId)}
                </span>

                {/* Account Info */}
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {formatAddress(account)}
                  </span>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="btn btn-danger text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn btn-primary flex items-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <span className="spinner"></span>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    <span>Connect MetaMask</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
