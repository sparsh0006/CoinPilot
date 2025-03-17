/**
 * Utility functions for interacting with Keplr wallet
 */

/**
 * Send a transaction using Keplr
 * @param amount Amount to send in INJ
 * @param toAddress Destination address
 * @returns Transaction result
 */
export const sendTransaction = async (amount: string, toAddress: string) => {
  try {
    // Check if Keplr is installed
    if (!window.keplr) {
      throw new Error("Keplr extension is not installed");
    }

    // Enable Injective chain
    await window.keplr.enable("injective-888");
    const offlineSigner = window.keplr.getOfflineSigner("injective-1");
    const accounts = await offlineSigner.getAccounts();
    
    // Check if we have an account
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found in Keplr");
    }
    
    const fromAddress = accounts[0].address;
    
    // Parse amount to a number
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      throw new Error("Invalid amount");
    }

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
    const result = await window.keplr.sendTx(
      "injective-888",
      Buffer.from(JSON.stringify(sendMsg)),
      "BROADCAST_MODE_BLOCK",
      {
        fee: fee,
        memo: "DCA Transaction"
      }
    );

    console.log("Transaction successful:", result);
    return result;
  } catch (error) {
    console.error("Keplr transaction error:", error);
    throw error;
  }
};

/**
 * Check if Keplr wallet is installed
 * @returns Boolean indicating if Keplr is available
 */
export const isKeplrAvailable = (): boolean => {
  return !!window.keplr;
};

/**
 * Get the connected wallet address
 * @returns The connected wallet address or null
 */
export const getConnectedAddress = async (): Promise<string | null> => {
  try {
    if (!window.keplr) {
      return null;
    }
    
    await window.keplr.enable("injective-888");
    const offlineSigner = window.keplr.getOfflineSigner("injective-888");
    const accounts = await offlineSigner.getAccounts();
    
    if (accounts && accounts.length > 0) {
      return accounts[0].address;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting connected address:", error);
    return null;
  }
};