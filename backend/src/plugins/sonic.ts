// import { DCAPlugin } from "./types";
// import { 
//     Connection, 
//     PublicKey, 
//     Keypair, 
//     Transaction, 
//     TransactionInstruction, 
//     SystemProgram, 
//     sendAndConfirmTransaction 
// } from '@solana/web3.js';
// import { 
//     TOKEN_PROGRAM_ID, 
//     getOrCreateAssociatedTokenAccount,
//     transfer 
// } from '@solana/spl-token';
// import dotenv from 'dotenv';
// import { logger } from '../utils/logger';
// import bs58 from 'bs58';

// dotenv.config();

// export class SonicPlugin implements DCAPlugin {
//     name = "sonic";
    
//     // Use the existing pool addresses
//     private readonly USDC_MINT = '7kdH6DvwPSxov7pGUrDwta6CNsosZuH1HVbxSdLH57AU'; // USDC
//     private readonly SONIC_MINT = '8GgYcsRw6WCtAXvcuvLmeHH3jA6WAMrecXQu3UcMRTQ6'; // SONIC
//     private readonly PROGRAM_ID = 'HoGLe4rmFQ25oNNiRQ4rueYsKzEJdnoLFhoVtafjcC66'; // AMM Program
//     private readonly POOL_ACCOUNT = 'BbLDYff58ov1rBPgjyoUPXPpDc5wn57Y2qyoYXdBuMVK'; // Existing pool
//     private readonly POOL_USDC_ACCOUNT = 'A7wE55nnVYEHfGy7EVpAGGiHsNTT3vP6TXgoJQEUB4ex'; // Pool USDC
//     private readonly POOL_SONIC_ACCOUNT = 'FnQ817TVbYgj8SwX42TRbZEgfHUotB9D5ESLGJUzFwMj'; // Pool SONIC
    
//     private readonly connection: Connection;

//     constructor() {
//         this.connection = new Connection('https://api.testnet.sonic.game', 'confirmed');
//         logger.info('Initialized Sonic.game plugin with testnet connection');
//         logger.info(`Using existing pool: ${this.POOL_ACCOUNT}`);
//     }

//     async sendTransaction(
//         amount: number,
//         fromAddress: string,
//         toAddress: string
//     ): Promise<string> {
//         try {
//             if (!process.env.PRIVATE_KEY_SONIC) {
//                 throw new Error("Private key for Sonic not found in environment variables (PRIVATE_KEY_SONIC)");
//             }

//             // Parse the private key with improved error handling
//             let wallet;
//             try {
//                 // Get the private key from environment
//                 const privateKeyString = process.env.PRIVATE_KEY_SONIC || '';
//                 let privateKeyBytes;
                
//                 // Check if it's a base58 encoded key (standard Solana format)
//                 if (privateKeyString.length === 88 || privateKeyString.length === 44) {
//                     privateKeyBytes = bs58.decode(privateKeyString);
//                 }
//                 // Try parsing as JSON array
//                 else if (privateKeyString.startsWith('[') && privateKeyString.endsWith(']')) {
//                     privateKeyBytes = new Uint8Array(JSON.parse(privateKeyString));
//                 }
//                 // Try parsing as hex string
//                 else {
//                     // Remove any '0x' prefix if present
//                     const hexString = privateKeyString.startsWith('0x') 
//                         ? privateKeyString.slice(2) 
//                         : privateKeyString;
//                     privateKeyBytes = new Uint8Array(Buffer.from(hexString, 'hex'));
//                 }
                
//                 // Ensure the key is exactly 64 bytes (512 bits) for ed25519
//                 if (privateKeyBytes.length !== 64) {
//                     logger.info(`Private key length: ${privateKeyBytes.length} bytes (expected 64)`);
//                     throw new Error(`Invalid private key length: ${privateKeyBytes.length}. Expected 64 bytes.`);
//                 }
                
//                 wallet = Keypair.fromSecretKey(privateKeyBytes);
//                 logger.info(`Successfully loaded wallet: ${wallet.publicKey.toString()}`);
//             } catch (error) {
//                 logger.error('Error loading private key:', error);
//                 if (error instanceof Error) {
//                     throw new Error(`Failed to load wallet: ${error.message}`);
//                 } else {
//                     throw new Error('Failed to load wallet: Unknown error');
//                 }
//             }
            
//             logger.info(`Using wallet address: ${wallet.publicKey.toString()}`);
//             logger.info(`Sending tokens to: ${toAddress}`);
//             logger.info(`Swap amount: ${amount} USDC`);

//             // Convert strings to PublicKeys
//             const tokenAMint = new PublicKey(this.USDC_MINT);
//             const tokenBMint = new PublicKey(this.SONIC_MINT);
//             const programId = new PublicKey(this.PROGRAM_ID);
//             const poolAccount = new PublicKey(this.POOL_ACCOUNT);
//             const poolUsdcAccount = new PublicKey(this.POOL_USDC_ACCOUNT);
//             const poolSonicAccount = new PublicKey(this.POOL_SONIC_ACCOUNT);
            
//             // Get user token accounts
//             const userUsdcAccount = await getOrCreateAssociatedTokenAccount(
//                 this.connection, wallet, tokenAMint, wallet.publicKey
//             );
//             logger.info(`User USDC account: ${userUsdcAccount.address.toString()}`);
            
//             const userSonicAccount = await getOrCreateAssociatedTokenAccount(
//                 this.connection, wallet, tokenBMint, wallet.publicKey
//             );
//             logger.info(`User SONIC account: ${userSonicAccount.address.toString()}`);
            
//             // Convert amount to proper format (USDC has 6 decimals)
//             const amountInBaseUnits = Math.floor(amount * 1000000); // 6 decimals for USDC
            
//             // First transfer USDC to the pool
//             logger.info(`Transferring ${amount} USDC to the pool...`);
//             await transfer(
//                 this.connection,
//                 wallet,
//                 userUsdcAccount.address,
//                 poolUsdcAccount,
//                 wallet.publicKey,
//                 amountInBaseUnits
//             );
            
//             logger.info('Creating swap instruction...');
            
//             // Prepare instruction data for swapping USDC to SONIC
//             const data = Buffer.alloc(1 + 8);
//             data.writeUInt8(1, 0); // Instruction index 1 = swap_token_a_to_token_b
//             data.writeBigUInt64LE(BigInt(amountInBaseUnits), 1);
            
//             // Create the instruction
//             const instruction = new TransactionInstruction({
//                 keys: [
//                     { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
//                     { pubkey: poolAccount, isSigner: false, isWritable: true },
//                     { pubkey: poolUsdcAccount, isSigner: false, isWritable: true },
//                     { pubkey: poolSonicAccount, isSigner: false, isWritable: true },
//                     { pubkey: userUsdcAccount.address, isSigner: false, isWritable: true },
//                     { pubkey: userSonicAccount.address, isSigner: false, isWritable: true },
//                     { pubkey: tokenAMint, isSigner: false, isWritable: false },
//                     { pubkey: tokenBMint, isSigner: false, isWritable: false },
//                     { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
//                 ],
//                 programId,
//                 data
//             });
            
//             // Create and send the transaction
//             const transaction = new Transaction().add(instruction);
            
//             try {
//                 // Get recent blockhash
//                 const { blockhash } = await this.connection.getLatestBlockhash();
//                 transaction.recentBlockhash = blockhash;
//                 transaction.feePayer = wallet.publicKey;
                
//                 const signature = await sendAndConfirmTransaction(
//                     this.connection,
//                     transaction,
//                     [wallet],
//                     { commitment: 'confirmed' }
//                 );
                
//                 logger.info(`Swap transaction successful: ${signature}`);
                
//                 // After swap is complete, send SONIC tokens to desired address if different from wallet
//                 if (toAddress !== wallet.publicKey.toString()) {
//                     logger.info(`Need to send SONIC tokens to ${toAddress}`);
                    
//                     // Get recipient token account
//                     const recipientPubkey = new PublicKey(toAddress);
//                     const recipientSonicAccount = await getOrCreateAssociatedTokenAccount(
//                         this.connection, 
//                         wallet, 
//                         tokenBMint, 
//                         recipientPubkey
//                     );
                    
//                     // Get the swapped amount - this would be better with actual calculation
//                     // For simplicity, we'll use an estimated rate based on the given price
//                     const sonicPriceUSD = 0.2478; // 1 SONIC = $0.2478
//                     const estimatedSonicAmount = Math.floor((amount / sonicPriceUSD) * 1000000000); // 9 decimals
                    
//                     // Send tokens to recipient
//                     const transferSignature = await transfer(
//                         this.connection,
//                         wallet,
//                         userSonicAccount.address,
//                         recipientSonicAccount.address,
//                         wallet.publicKey,
//                         estimatedSonicAmount
//                     );
                    
//                     logger.info(`Transferred SONIC tokens to recipient. Signature: ${transferSignature}`);
//                     return transferSignature;
//                 }
                
//                 return signature;
//             } catch (error) {
//                 logger.error(`Transaction execution failed: ${error}`);
//                 throw error;
//             }
//         } catch (error) {
//             logger.error(`Failed to execute swap: ${error}`);
//             throw new Error(`Failed to execute swap: ${error}`);
//         }
//     }

//     async getUSDTBalance(address: string): Promise<number> {
//         try {
//             // Convert string address to PublicKey
//             const publicKey = new PublicKey(address);
//             const tokenMint = new PublicKey(this.USDC_MINT);
            
//             // Use simpler method to get token accounts
//             const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
//                 publicKey,
//                 { mint: tokenMint }
//             );
            
//             logger.info(`Found ${tokenAccounts.value.length} USDC token accounts for ${address}`);
            
//             if (tokenAccounts.value.length === 0) {
//                 // No token account found for this mint
//                 return 0;
//             }
            
//             // Get the balance from the first account
//             const tokenAccount = tokenAccounts.value[0];
//             const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
            
//             return balance;
//         } catch (error) {
//             // If no balance found or error occurs, return 0
//             logger.error(`Failed to get USDT balance: ${error}`);
//             return 0;
//         }
//     }

//     async getNativeBalance(address: string): Promise<number> {
//         try {
//             // Convert string address to PublicKey
//             const publicKey = new PublicKey(address);
//             const tokenMint = new PublicKey(this.SONIC_MINT);
            
//             // Use simpler method to get token accounts
//             const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
//                 publicKey,
//                 { mint: tokenMint }
//             );
            
//             logger.info(`Found ${tokenAccounts.value.length} SONIC token accounts for ${address}`);
            
//             if (tokenAccounts.value.length === 0) {
//                 // No token account found for this mint
//                 return 0;
//             }
            
//             // Get the balance from the first account
//             const tokenAccount = tokenAccounts.value[0];
//             const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
            
//             return balance;
//         } catch (error) {
//             // If no balance found or error occurs, return 0
//             logger.error(`Failed to get SONIC balance: ${error}`);
//             return 0;
//         }
//     }
// }
import { DCAPlugin } from "./types";
import { 
    Connection, 
    PublicKey, 
    Keypair, 
    Transaction, 
    TransactionInstruction, 
    SystemProgram, 
    sendAndConfirmTransaction 
} from '@solana/web3.js';
import { 
    TOKEN_PROGRAM_ID, 
    getOrCreateAssociatedTokenAccount,
    transfer 
} from '@solana/spl-token';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import bs58 from 'bs58';

dotenv.config();

export class SonicPlugin implements DCAPlugin {
    name = "sonic";
    
    // Use the existing pool addresses
    private readonly USDC_MINT = '7kdH6DvwPSxov7pGUrDwta6CNsosZuH1HVbxSdLH57AU'; // USDC
    private readonly SONIC_MINT = '8GgYcsRw6WCtAXvcuvLmeHH3jA6WAMrecXQu3UcMRTQ6'; // SONIC
    private readonly PROGRAM_ID = 'HoGLe4rmFQ25oNNiRQ4rueYsKzEJdnoLFhoVtafjcC66'; // AMM Program
    private readonly POOL_ACCOUNT = 'BbLDYff58ov1rBPgjyoUPXPpDc5wn57Y2qyoYXdBuMVK'; // Existing pool
    private readonly POOL_USDC_ACCOUNT = 'A7wE55nnVYEHfGy7EVpAGGiHsNTT3vP6TXgoJQEUB4ex'; // Pool USDC
    private readonly POOL_SONIC_ACCOUNT = 'FnQ817TVbYgj8SwX42TRbZEgfHUotB9D5ESLGJUzFwMj'; // Pool SONIC
    
    private readonly connection: Connection;

    constructor() {
        this.connection = new Connection('https://api.testnet.sonic.game', 'confirmed');
        logger.info('Initialized Sonic.game plugin with testnet connection');
        logger.info(`Using existing pool: ${this.POOL_ACCOUNT}`);
    }

    async sendTransaction(
        amount: number,
        fromAddress: string,
        toAddress: string,
        options: { slippageTolerance?: number } = {}
    ): Promise<string> {
        // Default slippage tolerance to 2% if not provided
        const slippageTolerance = options.slippageTolerance || 2.0;
        try {
            if (!process.env.PRIVATE_KEY_SONIC) {
                throw new Error("Private key for Sonic not found in environment variables (PRIVATE_KEY_SONIC)");
            }

            // Parse the private key with improved error handling
            let wallet;
            try {
                // Get the private key from environment
                const privateKeyString = process.env.PRIVATE_KEY_SONIC || '';
                let privateKeyBytes;
                
                // Check if it's a base58 encoded key (standard Solana format)
                if (privateKeyString.length === 88 || privateKeyString.length === 44) {
                    privateKeyBytes = bs58.decode(privateKeyString);
                }
                // Try parsing as JSON array
                else if (privateKeyString.startsWith('[') && privateKeyString.endsWith(']')) {
                    privateKeyBytes = new Uint8Array(JSON.parse(privateKeyString));
                }
                // Try parsing as hex string
                else {
                    // Remove any '0x' prefix if present
                    const hexString = privateKeyString.startsWith('0x') 
                        ? privateKeyString.slice(2) 
                        : privateKeyString;
                    privateKeyBytes = new Uint8Array(Buffer.from(hexString, 'hex'));
                }
                
                // Ensure the key is exactly 64 bytes (512 bits) for ed25519
                if (privateKeyBytes.length !== 64) {
                    logger.info(`Private key length: ${privateKeyBytes.length} bytes (expected 64)`);
                    throw new Error(`Invalid private key length: ${privateKeyBytes.length}. Expected 64 bytes.`);
                }
                
                wallet = Keypair.fromSecretKey(privateKeyBytes);
                logger.info(`Successfully loaded wallet: ${wallet.publicKey.toString()}`);
            } catch (error) {
                logger.error('Error loading private key:', error);
                if (error instanceof Error) {
                    throw new Error(`Failed to load wallet: ${error.message}`);
                } else {
                    throw new Error('Failed to load wallet: Unknown error');
                }
            }
            
            logger.info(`Using wallet address: ${wallet.publicKey.toString()}`);
            logger.info(`Sending tokens to: ${toAddress}`);
            logger.info(`Swap amount: ${amount} USDC`);

            // Convert strings to PublicKeys
            const tokenAMint = new PublicKey(this.USDC_MINT);
            const tokenBMint = new PublicKey(this.SONIC_MINT);
            const programId = new PublicKey(this.PROGRAM_ID);
            const poolAccount = new PublicKey(this.POOL_ACCOUNT);
            const poolUsdcAccount = new PublicKey(this.POOL_USDC_ACCOUNT);
            const poolSonicAccount = new PublicKey(this.POOL_SONIC_ACCOUNT);
            
            // Get user token accounts
            const userUsdcAccount = await getOrCreateAssociatedTokenAccount(
                this.connection, wallet, tokenAMint, wallet.publicKey
            );
            logger.info(`User USDC account: ${userUsdcAccount.address.toString()}`);
            
            const userSonicAccount = await getOrCreateAssociatedTokenAccount(
                this.connection, wallet, tokenBMint, wallet.publicKey
            );
            logger.info(`User SONIC account: ${userSonicAccount.address.toString()}`);
            
            // Convert amount to proper format (USDC has 6 decimals)
            const amountInBaseUnits = Math.floor(amount * 1000000); // 6 decimals for USDC
            
            // First transfer USDC to the pool
            logger.info(`Transferring ${amount} USDC to the pool...`);
            await transfer(
                this.connection,
                wallet,
                userUsdcAccount.address,
                poolUsdcAccount,
                wallet.publicKey,
                amountInBaseUnits
            );
            
            logger.info('Creating swap instruction...');
            
            // Prepare instruction data for swapping USDC to SONIC
            const data = Buffer.alloc(1 + 8);
            data.writeUInt8(1, 0); // Instruction index 1 = swap_token_a_to_token_b
            data.writeBigUInt64LE(BigInt(amountInBaseUnits), 1);
            
            // Create the instruction
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                    { pubkey: poolAccount, isSigner: false, isWritable: true },
                    { pubkey: poolUsdcAccount, isSigner: false, isWritable: true },
                    { pubkey: poolSonicAccount, isSigner: false, isWritable: true },
                    { pubkey: userUsdcAccount.address, isSigner: false, isWritable: true },
                    { pubkey: userSonicAccount.address, isSigner: false, isWritable: true },
                    { pubkey: tokenAMint, isSigner: false, isWritable: false },
                    { pubkey: tokenBMint, isSigner: false, isWritable: false },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                ],
                programId,
                data
            });
            
            // Create and send the transaction
            const transaction = new Transaction().add(instruction);
            
            try {
                // Get recent blockhash
                const { blockhash } = await this.connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = wallet.publicKey;
                
                const signature = await sendAndConfirmTransaction(
                    this.connection,
                    transaction,
                    [wallet],
                    { commitment: 'confirmed' }
                );
                
                logger.info(`Swap transaction successful: ${signature}`);
                
                // After swap is complete, send SONIC tokens to desired address
                // First, let's wait a moment for the blockchain to process the swap
                logger.info("Waiting for swap confirmation and token balance update...");
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                
                // Use a fixed rate approach for now since balance checking is unreliable
                const sonicUsdtRate = 4.0; // 1 USDT = 4 SONIC
                const sonicAmountToTransfer = Math.floor(amount * sonicUsdtRate * 1000000000); // 9 decimals
                
                logger.info(`Using fixed exchange rate: 1 USDT = ${sonicUsdtRate} SONIC`);
                logger.info(`Calculated amount to transfer: ${sonicAmountToTransfer / 1000000000} SONIC`);
                
                if (toAddress !== wallet.publicKey.toString()) {
                    logger.info(`Need to send SONIC tokens to ${toAddress}`);
                    
                    // Get recipient token account
                    const recipientPubkey = new PublicKey(toAddress);
                    const recipientSonicAccount = await getOrCreateAssociatedTokenAccount(
                        this.connection, 
                        wallet, 
                        tokenBMint, 
                        recipientPubkey
                    );
                    
                    try {
                        // Send tokens to recipient
                        logger.info(`Transferring ${sonicAmountToTransfer / 1000000000} SONIC to recipient at ${recipientSonicAccount.address.toString()}`);
                        
                        const transferSignature = await transfer(
                            this.connection,
                            wallet,
                            userSonicAccount.address,
                            recipientSonicAccount.address,
                            wallet.publicKey,
                            sonicAmountToTransfer
                        );
                        
                        logger.info(`Successfully transferred ${sonicAmountToTransfer / 1000000000} SONIC tokens to recipient. Signature: ${transferSignature}`);
                    } catch (error) {
                        logger.error(`Error during SONIC transfer: ${error}`);
                        
                        // If transfer fails, let's check balances for debugging
                        try {
                            const walletSonicBalance = await this.getNativeBalance(wallet.publicKey.toString());
                            logger.info(`Wallet SONIC balance: ${walletSonicBalance}`);
                            
                            // Get the token account balance directly
                            const tokenBalance = await this.connection.getTokenAccountBalance(userSonicAccount.address);
                            logger.info(`Token account balance: ${tokenBalance.value.uiAmount}`);
                        } catch (balanceError) {
                            logger.error(`Error checking balances: ${balanceError}`);
                        }
                        
                        throw new Error(`Failed to transfer SONIC tokens: ${error}`);
                    }
                    const transferSignature = await transfer(
                        this.connection,
                        wallet,
                        userSonicAccount.address,
                        recipientSonicAccount.address,
                        wallet.publicKey,
                        sonicAmountToTransfer
                    );
                    return transferSignature;
                }
                
                return signature;
            } catch (error) {
                logger.error(`Transaction execution failed: ${error}`);
                throw error;
            }
        } catch (error) {
            logger.error(`Failed to execute swap: ${error}`);
            throw new Error(`Failed to execute swap: ${error}`);
        }
    }

    async getUSDTBalance(address: string): Promise<number> {
        try {
            // Convert string address to PublicKey
            const publicKey = new PublicKey(address);
            const tokenMint = new PublicKey(this.USDC_MINT);
            
            // Use simpler method to get token accounts
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                publicKey,
                { mint: tokenMint }
            );
            
            logger.info(`Found ${tokenAccounts.value.length} USDC token accounts for ${address}`);
            
            if (tokenAccounts.value.length === 0) {
                // No token account found for this mint
                return 0;
            }
            
            // Get the balance from the first account
            const tokenAccount = tokenAccounts.value[0];
            const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
            
            return balance;
        } catch (error) {
            // If no balance found or error occurs, return 0
            logger.error(`Failed to get USDT balance: ${error}`);
            return 0;
        }
    }

    async getNativeBalance(address: string): Promise<number> {
        try {
            // Convert string address to PublicKey
            const publicKey = new PublicKey(address);
            const tokenMint = new PublicKey(this.SONIC_MINT);
            
            // Use simpler method to get token accounts
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                publicKey,
                { mint: tokenMint }
            );
            
            logger.info(`Found ${tokenAccounts.value.length} SONIC token accounts for ${address}`);
            
            if (tokenAccounts.value.length === 0) {
                // No token account found for this mint
                return 0;
            }
            
            // Get the balance from the first account
            const tokenAccount = tokenAccounts.value[0];
            const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
            
            return balance;
        } catch (error) {
            // If no balance found or error occurs, return 0
            logger.error(`Failed to get SONIC balance: ${error}`);
            return 0;
        }
    }
}