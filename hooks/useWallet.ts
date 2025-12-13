import { useState, useCallback, useEffect } from 'react';

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface UseWalletReturn {
    address: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
}

export function useWallet(): UseWalletReturn {
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for existing connection on mount
    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        setAddress(accounts[0]);
                    }
                } catch (err) {
                    console.error("Failed to check wallet connection:", err);
                }
            }
        };

        checkConnection();
    }, []);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            setError('MetaMask is not installed. Please install it to continue.');
            setIsConnecting(false);
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                setAddress(accounts[0]);
            } else {
                setError('No accounts found');
            }
        } catch (err: any) {
            if (err.code === 4001) {
                // EIP-1193 userRejectedRequest error
                setError('Please connect to MetaMask.');
            } else {
                setError(err.message || 'Failed to connect wallet');
            }
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAddress(null);
    }, []);

    return {
        address,
        isConnected: !!address,
        isConnecting,
        error,
        connect,
        disconnect,
    };
}
