import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { API_URL } from '../constants';


interface PaymentRequest {
    accepts: {
        amount: string;
        asset: string;
        network: string;
        payTo: string;
        maxTimeoutSeconds: number;
        extra?: {
            name?: string;
            version?: string;
        };
    }[];
    resource: any;
}

export function useX402() {
    const { address } = useWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQuote = useCallback(async (url: string, init?: RequestInit): Promise<PaymentRequest | null> => {
        setLoading(true);
        setError(null);
        try {
            console.log(init, "init");

            const res = await fetch(url, {
                method: 'POST',
                ...init,
                headers: {
                    ...init?.headers
                }
            });

            if (res.status !== 402) {
                if (res.ok) {
                    setError('Payment not required for this resource.');
                    return null;
                }
                throw new Error(`Unexpected status: ${res.status}`);
            }

            const paymentHeader = res.headers.get('PAYMENT-REQUIRED');
            if (!paymentHeader) {
                throw new Error('No PAYMENT-REQUIRED header found');
            }

            const paymentRequired = JSON.parse(atob(paymentHeader));
            return paymentRequired;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch quote');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const pay = useCallback(async (url: string, paymentRequest: PaymentRequest, init?: RequestInit) => {
        if (!address || !window.ethereum) {
            setError('Wallet not connected');
            throw new Error('Wallet not connected');
        }

        setLoading(true);
        setError(null);

        try {
            const accepts = paymentRequest.accepts[0]; // Use first option
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Parse chainId
            const chainId = parseInt(accepts.network.split(':')[1]);
            const hexChainId = '0x' + chainId.toString(16);

            // Check current chain matches
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (currentChainId !== hexChainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: hexChainId }],
                    });
                } catch (switchError: any) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        // TODO: Add support for adding the chain dynamically.
                        // For now we assume typical networks or user can add manually.
                        // Base Sepolia:
                        if (chainId === 84532) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: hexChainId,
                                    chainName: 'Base Sepolia',
                                    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                                    rpcUrls: ['https://sepolia.base.org'],
                                    blockExplorerUrls: ['https://sepolia.basescan.org']
                                }],
                            });
                        }
                    }
                    throw switchError;
                }
                // Update provider after switch
            }

            // EIP-712 domain
            const domain = {
                name: accepts.extra?.name || 'USDC',
                version: accepts.extra?.version || '2',
                chainId: chainId,
                verifyingContract: accepts.asset
            };

            // EIP-3009 types
            const types = {
                TransferWithAuthorization: [
                    { name: 'from', type: 'address' },
                    { name: 'to', type: 'address' },
                    { name: 'value', type: 'uint256' },
                    { name: 'validAfter', type: 'uint256' },
                    { name: 'validBefore', type: 'uint256' },
                    { name: 'nonce', type: 'bytes32' }
                ]
            };

            // Generate nonce
            const nonceBytes = new Uint8Array(32);
            crypto.getRandomValues(nonceBytes);
            const nonce = '0x' + Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('');

            const now = Math.floor(Date.now() / 1000);
            const message = {
                from: address,
                to: accepts.payTo,
                value: accepts.amount,
                validAfter: now.toString(),
                validBefore: (now + accepts.maxTimeoutSeconds).toString(),
                nonce: nonce
            };

            console.log('Signing:', { domain, types, message });
            const sig = await signer.signTypedData(domain, types, message);

            const paymentPayload = btoa(JSON.stringify({
                x402Version: 2,
                payload: {
                    authorization: {
                        from: address,
                        to: accepts.payTo,
                        value: accepts.amount,
                        validAfter: message.validAfter,
                        validBefore: message.validBefore,
                        nonce: nonce
                    },
                    signature: sig
                },
                accepted: accepts,
                resource: paymentRequest.resource
            }));

            const res = await fetch(url, {
                method: 'POST',
                ...init,
                headers: {
                    ...init?.headers,
                    'PAYMENT-SIGNATURE': paymentPayload
                }
            });

            if (!res.ok) {
                throw new Error(`Payment failed: ${res.status}`);
            }

            return await res.json();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Payment failed');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [address]);

    return {
        loading,
        error,
        fetchQuote,
        pay
    };
}
