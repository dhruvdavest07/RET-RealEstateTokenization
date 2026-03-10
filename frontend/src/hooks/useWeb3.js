import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, TOKEN_IT_ABI, NETWORK_CONFIG } from '../contracts/config';

export function useWeb3() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum !== undefined;
  };

  // Initialize read-only provider for viewing data without MetaMask
  useEffect(() => {
    const initReadOnly = async () => {
      try {
        console.log('Initializing read-only provider...');
        console.log('RPC URL:', NETWORK_CONFIG.rpcUrl);
        console.log('Contract address:', CONTRACT_ADDRESSES.TOKEN_IT);
        
        const readOnlyProvider = new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
        
        // Test the connection
        const blockNumber = await readOnlyProvider.getBlockNumber();
        console.log('Connected! Block number:', blockNumber);
        
        const readOnlyContract = new ethers.Contract(
          CONTRACT_ADDRESSES.TOKEN_IT,
          TOKEN_IT_ABI,
          readOnlyProvider
        );
        
        // Test contract
        const totalProps = await readOnlyContract.getTotalProperties();
        console.log('Total properties:', totalProps.toString());
        
        setContract(readOnlyContract);
        setProvider(readOnlyProvider);
        setDebugInfo(`Connected to block ${blockNumber}, ${totalProps} properties`);
      } catch (err) {
        console.error('Read-only provider init failed:', err);
        setDebugInfo(`Error: ${err.message}`);
      }
    };
    initReadOnly();
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask.');
        return;
      }

      const account = accounts[0];
      setAccount(account);

      // Create provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const signer = provider.getSigner();
      setSigner(signer);

      // Create contract instance with signer for writes
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN_IT,
        TOKEN_IT_ABI,
        signer
      );
      setContract(contract);

      // Get chain ID
      const network = await provider.getNetwork();
      setChainId(network.chainId);

      // Check if on correct network
      if (network.chainId !== 31337) {
        await switchToHardhatNetwork();
      }

    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Switch to Hardhat network
  const switchToHardhatNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
        } catch (addError) {
          setError('Failed to add Hardhat network to MetaMask');
        }
      }
    }
  };

  // Disconnect (just clears local state)
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setChainId(null);
    setError(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) {
        connectWallet();
      }
    });

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectWallet, disconnect, account]);

  return {
    account,
    provider,
    signer,
    contract,
    isConnecting,
    error,
    chainId,
    debugInfo,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnect,
  };
}
