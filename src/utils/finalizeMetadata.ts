import {
  Metaplex,
  keypairIdentity,
  walletAdapterIdentity,
  toMetaplexFileFromBrowser,
} from '@metaplex-foundation/js';
import {
  PublicKey,
  Connection,
  clusterApiUrl,
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

interface FinalizeParams {
  mintAddress: string;
  metadataUri: string;
  name: string;
  symbol: string;
  description: string;
  wallet: WalletContextState;
  connection: Connection;
}

export const finalizeTokenMetadata = async ({
  mintAddress,
  metadataUri,
  name,
  symbol,
  description,
  wallet,
  connection,
}: FinalizeParams) => {
  if (!wallet?.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error('Wallet not connected or missing signing methods.');
  }

  try {
    const mint = new PublicKey(mintAddress);
    const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));

    const { uri: metadataURI } = await metaplex
      .nfts()
      .create({
        uri: metadataUri,
        name,
        symbol,
        sellerFeeBasisPoints: 0, // 0 = no royalty
        mintAddress: mint,
        updateAuthority: wallet.publicKey,
        isMutable: true,
      });

    console.log('✅ Metadata finalized at:', metadataURI);
    return metadataURI;
  } catch (err) {
    console.error('❌ Finalization failed:', err);
    throw err;
  }
};
