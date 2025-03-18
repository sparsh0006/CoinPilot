import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';

function Wallet() {
    const { connected, publicKey } = useWallet();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Use the correct API URL
    const API_URL = "http://localhost:8000/api";

    // Effect to store wallet info in DB when connected
    useEffect(() => {
        const storeWalletInfo = async () => {
            if (connected && publicKey) {
                try {
                    setIsLoading(true);
                    setError(null);
                    
                    const address = publicKey.toString();
                    console.log('Wallet connected:', address);
                    
                    // Send wallet address to backend API to create or find user
                    const response = await axios.post(`${API_URL}/user`, { address });
                    
                    // Set user data from response
                    setUser(response.data);
                    console.log('User data retrieved from database:', response.data);
                } catch (error) {
                    console.error('Failed to store wallet info:', error);
                    setError('Failed to connect wallet. Please try again.');
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Clear user data when disconnected
                setUser(null);
            }
        };

        storeWalletInfo();
    }, [connected, publicKey]);

    // Function to get user ID for other components
    const getUserId = () => {
        return user?._id || null;
    };

    // Function to get wallet address for other components
    const getWalletAddress = () => {
        return publicKey?.toString() || null;
    };

    // Expose these methods to parent components
    if (typeof window !== 'undefined') {
        window.getUserId = getUserId;
        window.getWalletAddress = getWalletAddress;
    }

    return (
        <div className="App">
            <WalletMultiButton />
        </div>
    );
}

export default Wallet;