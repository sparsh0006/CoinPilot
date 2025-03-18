// src/WalletContext.tsx

import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  UnsafeBurnerWalletAdapter 
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Import the styles with ESM import instead of require
import '@solana/wallet-adapter-react-ui/styles.css';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';

const WalletContext: FC<{ children: React.ReactNode }> = ({ children }) => {
    // Use the custom Sonic Game testnet endpoint
    const endpoint = "https://api.testnet.sonic.game";

    // Configure the wallet adapters you want to use
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new BackpackWalletAdapter(),
            new UnsafeBurnerWalletAdapter()
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletContext;