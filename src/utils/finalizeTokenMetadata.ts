// src/utils/finalizeTokenMetadata.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey, none, signerIdentity } from '@metaplex-foundation/umi';
import type { Signer } from '@metaplex-foundation/umi';
import type { PublicKey as Web3PublicKey } from '@solana/web3.js';
import { getRpcEndpoint } from '../config/rpc';

type Params = {
  signer: Signer;
  mintAddress: Web3PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
};

/**
 * Creates the Token Metadata account (V3) for a new SPL mint.
 * Uses your configured RPC (Helius) via getRpcEndpoint().
 *
 * Returns the confirmed transaction signature (string).
 */
export async function finalizeTokenMetadata({
  signer,
  mintAddress,
  metadataUri,
  name,
  symbol,
}: Params): Promise<string> {
  const umi = createUmi(getRpcEndpoint())
    .use(mplTokenMetadata())
    .use(signerIdentity(signer));

  const mint = publicKey(mintAddress.toBase58());

  const { signature } = await createMetadataAccountV3(umi, {
    mint,
    mintAuthority: signer,
    payer: signer,
    updateAuthority: signer,
    data: {
      name,
      symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: none(),
      collection: none(),
      uses: none(),
    },
    // allow future updates before you lock it down (can flip to false later)
    isMutable: true,
    collectionDetails: none(),
  }).sendAndConfirm(umi);

  return signature.toString();
}
