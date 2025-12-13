import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useWallet } from "../hooks/useWallet";
import { useX402 } from "../hooks/useX402";
import { formatUnits } from "ethers";
import { API_URL } from "@/constants";
import { BackendEndpoints } from "@/contracts";

interface CryptoPaymentViewProps {
    amount: number | string;
    currency: string;
    onPay: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const CryptoPaymentView = ({
    amount: initialAmount,
    currency,
    onPay,
    onCancel,
    isLoading: parentLoading = false,
}: CryptoPaymentViewProps) => {
    const { isConnected, isConnecting, error: walletError, connect, address } = useWallet();
    const { fetchQuote, pay, loading: x402Loading, error: x402Error } = useX402();

    const [quote, setQuote] = useState<any>(null);
    const [fetchingQuote, setFetchingQuote] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (isConnected) {
            const getQuote = async () => {
                setFetchingQuote(true);
                const q = await fetchQuote(`${API_URL}${BackendEndpoints.PAY_TRIP}`);
                if (q) {
                    setQuote(q);
                }
                setFetchingQuote(false);
            };
            getQuote();
        }
    }, [isConnected, fetchQuote]);

    const handlePay = async () => {
        if (!quote) return;
        try {
            await pay(`${API_URL}${BackendEndpoints.PAY_TRIP}`, quote);
            setPaymentSuccess(true);
            onPay(); // Notify parent of success
        } catch (e) {
            console.error("Payment failed", e);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col space-y-4">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Connect Wallet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Connect your crypto wallet to pay with USDC on the x402 network.
                    </p>
                </div>

                {walletError && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md text-center">
                        {walletError}
                    </div>
                )}

                <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={connect}
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting...
                        </>
                    ) : 'Connect Wallet'}
                </Button>

                <Button variant="ghost" className="w-full" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        );
    }

    const displayAmount = quote
        ? formatUnits(quote.accepts[0].amount, 6) // Assuming USDC (6 decimals). TODO: Check asset decimals dynamically if possible, or assume 6 for now as per x402
        : initialAmount;

    return (
        <div className="flex flex-col space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-700 font-medium">Wallet Connected</span>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-purple-600 font-mono">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                    </div>
                </div>

                {fetchingQuote ? (
                    <div className="flex items-center justify-center py-2">
                        <svg className="animate-spin h-5 w-5 text-purple-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-500">Getting quote...</span>
                    </div>
                ) : (
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm text-gray-600">Total Amount</span>
                        <span className="text-lg font-bold text-gray-900">{displayAmount} {currency}</span>
                    </div>
                )}
            </div>

            {x402Error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md text-center">
                    {x402Error}
                </div>
            )}

            {paymentSuccess && (
                <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md text-center">
                    Payment Successful!
                </div>
            )}

            <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6"
                onClick={handlePay}
                disabled={parentLoading || x402Loading || fetchingQuote || !quote || paymentSuccess}
            >
                {x402Loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Payment...
                    </>
                ) : paymentSuccess ? (
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Paid
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="font-bold">Pay {displayAmount} {currency}</span>
                        <span className="text-xs opacity-90 font-normal">via x402 Protocol</span>
                    </div>
                )}
            </Button>

            <Button variant="ghost" className="w-full" onClick={onCancel}>
                Change Payment Method
            </Button>
        </div>
    );
};
