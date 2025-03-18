
  export interface DCAPlugin {
    name: string;
    sendTransaction(amount: number, fromAddress: string, toAddress: string): Promise<string>;
    swapTokens?(amount: number, fromAddress: string): Promise<string>; // Added this method
    getUSDTBalance(address: string): Promise<number>;
    getNativeBalance(address: string): Promise<number>;
  }


export type SupportedPlugins = 'injective' | 'ton'; 