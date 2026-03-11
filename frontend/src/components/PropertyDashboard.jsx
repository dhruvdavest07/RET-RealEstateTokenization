import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export function PropertyDashboard({ property, investorInfo, isLoading, onRefresh }) {
  const [propertyId, setPropertyId] = useState('1');

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-48">
          <div className="spinner border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading property data...</span>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Loaded</h3>
          <p className="text-gray-500 mb-4">Enter a property ID to view details</p>
          
          <div className="flex items-center justify-center space-x-2">
            <input
              type="number"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="input w-32"
              placeholder="Property ID"
              min="1"
            />
            <button
              onClick={() => onRefresh(propertyId)}
              className="btn btn-primary"
            >
              Load Property
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Property #{property.propertyId}
            </h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              property.fractionalized 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {property.fractionalized ? 'Active' : 'Pending'}
            </span>
          </div>
          <p className="text-gray-500">Blockchain Real Estate Investment Trust</p>
        </div>
        <button
          onClick={() => onRefresh(property.propertyId)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Property Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">Total Shares</p>
          <p className="text-2xl font-bold text-blue-900">{property.totalShares}</p>
        </div>

        <div className="bg-teal-50 rounded-lg p-4">
          <p className="text-sm text-teal-600 font-medium mb-1">Available Shares</p>
          <p className="text-2xl font-bold text-teal-900">{property.availableShares || '?'}</p>
          <p className="text-xs text-teal-600 mt-1">
            {property.totalShares ? ((parseInt(property.availableShares || 0) / parseInt(property.totalShares) * 100).toFixed(1)) : 0}% left
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium mb-1">Share Price</p>
          <p className="text-2xl font-bold text-green-900">{property.sharePrice} ETH</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium mb-1">Rent Pool</p>
          <p className="text-2xl font-bold text-purple-900">{property.rentPool} ETH</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium mb-1">Property Value</p>
          <p className="text-2xl font-bold text-orange-900">
            {(parseFloat(property.sharePrice) * parseInt(property.totalShares)).toFixed(1)} ETH
          </p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-indigo-600 font-medium mb-1">Sold Shares</p>
          <p className="text-2xl font-bold text-indigo-900">
            {parseInt(property.totalShares || 0) - parseInt(property.availableShares || 0)}
          </p>
        </div>
      </div>

      {/* Share Token Address & Proceeds */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 font-medium mb-1">Share Token Contract</p>
        <p className="text-sm font-mono text-gray-800 break-all">{property.shareToken}</p>
      </div>

      {/* Share Sale Proceeds - Visible to all for transparency */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 mb-6 border border-emerald-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-emerald-700 font-medium">Share Sale Proceeds</p>
            <p className="text-xs text-emerald-600">Total ETH from share sales (admin withdrawable)</p>
          </div>
          <span className="text-2xl font-bold text-emerald-700">{property.shareSaleProceeds || '0'} ETH</span>
        </div>
      </div>

      {/* Investor Info (if connected) */}
      {investorInfo && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Investment</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium mb-1">Shares Owned</p>
              <p className="text-3xl font-bold text-indigo-900">{investorInfo.sharesOwned}</p>
            </div>

            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-sm text-teal-600 font-medium mb-1">Ownership</p>
              <p className="text-3xl font-bold text-teal-900">{investorInfo.ownershipPercentage}%</p>
            </div>

            <div className="text-center p-4 bg-rose-50 rounded-lg">
              <p className="text-sm text-rose-600 font-medium mb-1">Pending Dividends</p>
              <p className="text-3xl font-bold text-rose-900">{investorInfo.pendingDividends} ETH</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
