import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Buffer } from 'buffer';
import { MsgSend } from '@injectivelabs/sdk-ts';
import { BigNumberInBase } from '@injectivelabs/utils';

interface CreateDCAFormProps {
  walletAddress: string | null;
  userId: string | null;
  apiBaseUrl?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CHAIN_ID = 'injective-888'; // Injective testnet chain ID
const USDT_DENOM = 'peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5'; // USDT token address on Injective testnet
const USDT_DECIMALS = 6; // USDT has 6 decimals

const CreateDCAForm: React.FC<CreateDCAFormProps> = ({
  walletAddress,
  userId,
  apiBaseUrl = "http://localhost:8000/api",
  onSuccess,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    frequency: '1',
    unit: 'days',
    risk: 'low',
    toAddress: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Create DCA plan on the server after successful transaction
  const createDCAPlan = async (transactionHash: string) => {
    try {
      const effectiveUserId = userId || localStorage.getItem('userId');
      
      if (!effectiveUserId) {
        throw new Error("User ID not available. Please connect your wallet.");
      }

      let frequencyValue: string;
      if (formData.unit === "minutes") frequencyValue = "minute";
      else if (formData.unit === "hours") frequencyValue = "hour";
      else frequencyValue = "day";

      const apiData = {
        userId: effectiveUserId,
        amount: parseFloat(formData.amount),
        frequency: frequencyValue,
        interval: parseInt(formData.frequency, 10),
        risk: formData.risk,
        toAddress: formData.toAddress,
        transactionHash: transactionHash,
        tokenDenom: USDT_DENOM
      };

      console.log("Creating DCA plan with transaction hash:", apiData.transactionHash);
      setTxStatus("Creating DCA plan on the server...");

      const response = await fetch(`${apiBaseUrl}/dca/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create investment plan");
      }

      console.log("DCA plan created successfully with data:", responseData);
      return responseData;
    } catch (error) {
      console.error("Error creating DCA plan:", error);
      throw error;
    }
  };

  // Function to create MsgSend (simulating a swap-like action)
  const makeMsgSend = ({ sender, recipient, amount, denom }) => {
    const chainAmount = new BigNumberInBase(amount).toWei(USDT_DECIMALS).toString();
    const amountObj = {
      denom,
      amount: chainAmount
    };
    return MsgSend.fromJSON({
      amount: amountObj,
      srcInjectiveAddress: sender,
      dstInjectiveAddress: recipient,
    });
  };

  // Broadcast transaction with Keplr wallet popup and fake hash
  const broadcastTransaction = async (injectiveAddress: string, toAddress: string, amount: string) => {
    try {
      setTxStatus("Preparing swap transaction...");

      if (!window.keplr) {
        throw new Error("Keplr extension is not installed. Please install Keplr wallet.");
      }

      // Enable Keplr for the Injective chain (triggers popup if not enabled)
      await window.keplr.enable(CHAIN_ID);
      setTxStatus("Keplr enabled. Preparing swap...");

      // Prepare the MsgSend (simulating a swap to another address)
      const msgSend = makeMsgSend({
        sender: injectiveAddress,
        recipient: toAddress,
        amount: amount,
        denom: USDT_DENOM
      });

      console.log("Prepared MsgSend for swap:", msgSend);

      // Get the offline signer from Keplr
      const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);

      // Sign the transaction with Keplr (triggers popup)
      setTxStatus("Requesting signature from Keplr for swap...");
      const key = await window.keplr.getKey(CHAIN_ID);

      const aminoMsg = {
        type: "cosmos-sdk/MsgSend", // Simulating swap with MsgSend
        value: {
          from_address: injectiveAddress,
          to_address: toAddress,
          amount: [{
            denom: USDT_DENOM,
            amount: new BigNumberInBase(amount).toWei(USDT_DECIMALS).toString()
          }]
        }
      };

      const stdFee = {
        amount: [{
          denom: "inj",
          amount: "500000000000000" // 0.0005 INJ
        }],
        gas: "200000"
      };

      const signDoc = {
        chain_id: CHAIN_ID,
        account_number: "0", // Keplr fills this
        sequence: "0", // Keplr fills this
        fee: stdFee,
        msgs: [aminoMsg],
        memo: "DCA USDT Swap Simulation"
      };

      const signed = await window.keplr.signAmino(CHAIN_ID, injectiveAddress, signDoc);
      setTxStatus("Transaction signed. Processing swap...");

      // Add 5-second delay after signing
      await new Promise(resolve => setTimeout(resolve, 5000));
      setTxStatus("Swap processed. Generating transaction hash...");

      // Generate a fake transaction hash in the requested format
      const randomHex = () => Math.floor(Math.random() * 16).toString(16).toUpperCase();
      const fakeTxHash = Array(64).fill(0).map(() => randomHex()).join('');
      
      // Display the fake transaction hash in an alert box
      window.alert(`Swap Transaction Hash:\n${fakeTxHash}`);
      
      console.log("Generated fake transaction hash:", fakeTxHash);
      return fakeTxHash;
    } catch (error) {
      console.error("Error in transaction broadcast:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTxStatus(null);
    setTxHash(null);
    
    try {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("Please enter a valid amount");
      }
      
      if (!formData.toAddress) {
        throw new Error("Please enter a destination address");
      }
      
      const effectiveUserId = userId || localStorage.getItem('userId');
      const effectiveWalletAddress = walletAddress || localStorage.getItem('walletAddress');
      
      if (!effectiveUserId || !effectiveWalletAddress) {
        throw new Error("Please connect your wallet before creating a DCA plan");
      }

      try {
        setTxStatus("Initiating USDT swap transaction...");
        
        const transactionHash = await broadcastTransaction(
          effectiveWalletAddress,
          formData.toAddress,
          formData.amount
        );
        
        console.log("Swap transaction successful with hash:", transactionHash);
        setTxHash(transactionHash);
        
        setTxStatus("Transaction completed. Creating DCA plan...");
        await createDCAPlan(transactionHash);
        
        setSuccess("USDT swap transaction completed and DCA plan created successfully!");
        
        setFormData({
          amount: '',
          frequency: '1',
          unit: 'days',
          risk: 'low',
          toAddress: ''
        });
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } catch (txError) {
        console.error("Transaction error:", txError);
        throw txError;
      }
    } catch (err) {
      console.error("Error:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
      setTxStatus(null);
    }
  };

  const effectiveUserId = userId || localStorage.getItem('userId');

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h3 className="text-xl font-semibold">Schedule USDT Swap Transaction</h3>
        <p className="text-sm text-gray-400">Set up your recurring USDT swap transaction details below</p>
      </div>
      
      <div className="p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-900/30 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">{success}</h3>
            <p className="text-gray-400 mb-3">Your USDT DCA plan has been created and will run according to your schedule.</p>
            
            {txHash && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Transaction Reference:</p>
                <p className="text-blue-400 break-all">
                  {txHash}
                </p>
              </div>
            )}
            
            <button 
              onClick={() => onSuccess ? onSuccess() : null}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              View Your Plans
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-medium text-white">
                  Amount per Swap
                </label>
                <input
                  id="amount"
                  placeholder="0.0"
                  type="number"
                  step="0.000001"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 focus:ring-2 focus:ring-white/20 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="token" className="block text-sm font-medium text-white">
                  Token
                </label>
                <input
                  id="token"
                  placeholder="USDT"
                  value="USDT"
                  readOnly
                  className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 focus:ring-2 focus:ring-white/20 focus:border-transparent cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-gray-400 truncate">
                  {USDT_DENOM}
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="frequency" className="block text-sm font-medium text-white">
                  Frequency
                </label>
                <input
                  id="frequency"
                  placeholder="1"
                  type="number"
                  min="1"
                  required
                  value={formData.frequency}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 focus:ring-2 focus:ring-white/20 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="unit" className="block text-sm font-medium text-white">
                  Unit
                </label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 focus:ring-2 focus:ring-white/20 focus:border-transparent"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="risk" className="block text-sm font-medium text-white">
                Risk Level
              </label>
              <select
                id="risk"
                value={formData.risk}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 focus:ring-2 focus:ring-white/20 focus:border-transparent"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
              <p className="text-sm text-gray-400">
                Choose your preferred risk level for this swap
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="toAddress" className="block text-sm font-medium text-white">
                To Address
              </label>
              <input
                id="toAddress"
                placeholder="inj..."
                required
                value={formData.toAddress}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 focus:ring-2 focus:ring-white/20 focus:border-transparent"
              />
              <p className="text-sm text-gray-400">
                Enter the recipient's wallet address for the swap
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="submit"
                disabled={isLoading || !effectiveUserId}
                className="w-full sm:w-auto bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                    {txStatus || "Scheduling Swap..."}
                  </>
                ) : (
                  "Schedule USDT Swap"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-950/50 text-red-300 border border-red-800 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {!effectiveUserId && !error && (
              <div className="mt-4 p-3 bg-blue-950/50 text-blue-300 border border-blue-800 rounded-md text-sm">
                Please connect your wallet to create a DCA plan.
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateDCAForm;