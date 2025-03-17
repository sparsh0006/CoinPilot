interface KeplrWindow extends Window {
  keplr?: {
    enable: (chainId: string) => Promise<void>;
    getOfflineSigner: (chainId: string) => {
      getAccounts: () => Promise<{ address: string; pubkey: Uint8Array }[]>;
      signAmino: (signerAddress: string, signDoc: any) => Promise<any>;
    };
    getCosmWasmClient: (chainId: string) => Promise<any>;
    sendTx: (
      chainId: string,
      tx: Uint8Array | Buffer,
      mode: "BROADCAST_MODE_BLOCK" | "BROADCAST_MODE_SYNC" | "BROADCAST_MODE_ASYNC",
      options?: {
        fee?: {
          amount: { denom: string; amount: string }[];
          gas: string;
        };
        memo?: string;
      }
    ) => Promise<Uint8Array>;
  };
}

declare global {
  interface Window extends KeplrWindow {}
}

export {};