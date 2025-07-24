import {
  Metaplex,
  walletAdapterIdentity,
} from '@metaplex-foundation/js';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';

interface FinalizeParams {
  metadataUri: string;
  name: string;
  symbol: string;
  wallet: WalletContextState;
  connection: Connection;
}

export const finalizeTokenMetadata = async ({
  metadataUri,
  name,
  symbol,
  wallet,
  connection,
}: FinalizeParams) => {
  if (!wallet?.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error('Wallet not connected or missing signing methods.');
  }

  try {
    const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));

    const { nft } = await metaplex.nfts().create({
      uri: metadataUri,
      name,
      symbol,
      sellerFeeBasisPoints: 0,
      isMutable: true,
    });

    console.log('✅ Metadata finalized at:', nft.uri);
    return nft.uri;
  } catch (err) {
    console.error('❌ Finalization failed:', err);
    throw err;
  }
};
