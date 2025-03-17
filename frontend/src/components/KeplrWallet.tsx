import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    keplr?: any;
  }
}

interface KeplrWalletProps {
  onConnect?: (address: string, userId: string) => void;
  apiBaseUrl?: string;
}

const KeplrWallet: React.FC<KeplrWalletProps> = ({ 
  onConnect,
  apiBaseUrl = "http://localhost:8000/api"
}) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Chain ID for Injective
  const chainId = "injective-888";

  // Check if wallet is already connected
  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    const storedUserId = localStorage.getItem('userId');
    
    if (storedAddress) {
      setWalletAddress(storedAddress);
      
      // If we have both address and userId, call onConnect
      if (storedUserId && onConnect) {
        console.log("Reconnecting with stored credentials");
        onConnect(storedAddress, storedUserId);
      }
    }
  }, [onConnect]);

  /**
   * Send tokens using Keplr wallet
   * @param amount Amount to send (as string)
   * @param toAddress Recipient address
   * @returns Transaction result
   */
  const sendTokens = async (amount: string, toAddress: string) => {
    try {
      setStatus("Preparing transaction...");
      
      if (!window.keplr) {
        throw new Error("Keplr extension is not installed");
      }

      // Enable chain
      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in Keplr wallet");
      }
      
      const fromAddress = accounts[0].address;
      
      // Parse amount to a number
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Invalid amount");
      }

      setStatus("Requesting approval...");

      // Convert to the smallest unit (for INJ it would be 10^18 units)
      const amountInSmallestUnit = Math.floor(amountValue * 10**18).toString();

      // Prepare transaction
      const sendMsg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
          fromAddress: fromAddress,
          toAddress: toAddress,
          amount: [
            {
              denom: "inj",
              amount: amountInSmallestUnit
            }
          ]
        }
      };

      // Set transaction fee
      const fee = {
        amount: [{ denom: "inj", amount: "500000000000000" }], // 0.0005 INJ
        gas: "200000"
      };

      // Sign and broadcast the transaction
      const txBytes = Buffer.from(JSON.stringify(sendMsg));
      
      setStatus("Sending transaction...");
      
      const result = await window.keplr.sendTx(
        chainId,
        txBytes,
        "BROADCAST_MODE_BLOCK", // Wait for confirmation
        {
          fee: fee,
          memo: "DCA Transaction"
        }
      );

      console.log("Transaction successful:", result);
      setStatus(null);
      return result;
    } catch (error) {
      console.error("Error sending tokens with Keplr:", error);
      setStatus(null);
      throw error;
    }
  };

  const connectKeplrWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStatus("Connecting to Keplr wallet...");
      
      if (!window.keplr) {
        setError("Keplr extension not found. Please install Keplr.");
        return;
      }

      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length > 0) {
        const address = accounts[0].address;
        setWalletAddress(address);
        setStatus("Registering user...");
        
        try {
          // Register the user with the backend
          const response = await fetch(`${apiBaseUrl}/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address }),
          });

          if (!response.ok) {
            throw new Error(`Failed to register user: ${response.status}`);
          }

          const userData = await response.json();
          console.log('User registered successfully:', userData);
          
          if (!userData._id) {
            throw new Error('Server did not return a valid user ID');
          }
          
          // Store user data in localStorage
          localStorage.setItem('walletAddress', address);
          localStorage.setItem('userId', userData._id);
          
          // Call onConnect with the address and userId
          if (onConnect) {
            onConnect(address, userData._id);
          }
        } catch (err) {
          console.error('Error registering user:', err);
          setError(`Failed to register user: ${(err as Error).message}`);
          setWalletAddress(null);
        }
      } else {
        setError("Failed to retrieve accounts from Keplr.");
      }
    } catch (e) {
      setError("An error occurred: " + (e as Error).message);
      setWalletAddress(null);
    } finally {
      setIsLoading(false);
      setStatus(null);
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userId');
    setWalletAddress(null);
    window.location.reload(); // Reload to reset all states
  };

  // Add the sendTokens function to the window object so it can be accessed from other components
  useEffect(() => {
    // Add the function to window for global access
    if (typeof window !== 'undefined') {
      (window as any).keplrSendTokens = sendTokens;
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).keplrSendTokens;
      }
    };
  }, []);

  return (
    <div>
      {walletAddress ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
          </span>
          <button
            onClick={disconnectWallet}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connectKeplrWallet}
          disabled={isLoading}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
              {status || "Connecting..."}
            </>
          ) : (
            "Connect Wallet"
          )}
        </button>
      )}
      
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export default KeplrWallet;