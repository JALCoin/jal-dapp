// src/utils/finalizeTokenMetadata.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  mplTokenMetadata,
  createMetadataAccountV3,
  fetchMetadataFromSeeds,
} from '@metaplex-foundation/mpl-token-metadata';
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
 * Create the Token Metadata account (V3) for a new SPL mint.
 * - Uses RPC from getRpcEndpoint()
 * - Validates name/symbol length and URI format
 * - Throws if metadata already exists (idempotency)
 * - Returns the confirmed transaction signature
 */
export async function finalizeTokenMetadata({
  signer,
  mintAddress,
  metadataUri,
  name,
  symbol,
}: Params): Promise<string> {
  // ---- Validation (prevent on-chain errors)
  const enc = new TextEncoder();
  const trimmedName = (name ?? '').trim();
  const trimmedSymbol = (symbol ?? '').trim();
  const trimmedUri = (metadataUri ?? '').trim();

  if (!trimmedName) throw new Error('Token name is required.');
  if (!trimmedSymbol) throw new Error('Token symbol is required.');
  if (!trimmedUri) throw new Error('Metadata URI is required.');
  if (!/^https?:\/\/|^ipfs:\/\//i.test(trimmedUri)) {
    throw new Error('Metadata URI must start with http(s):// or ipfs://');
  }
  if (enc.encode(trimmedName).length > 32) {
    throw new Error('Name must be ≤ 32 bytes.');
  }
  if (enc.encode(trimmedSymbol).length > 10) {
    throw new Error('Symbol must be ≤ 10 bytes.');
  }

  // ---- UMI client w/ your RPC + Token Metadata plugin
  const umi = createUmi(getRpcEndpoint())
    .use(mplTokenMetadata())
    .use(signerIdentity(signer));

  const mint = publicKey(mintAddress.toBase58());

  // ---- Idempotency: bail if metadata already exists
  const existing = await fetchMetadataFromSeeds(umi, { mint }).catch(() => null);
  if (existing && existing.uri) {
    throw new Error('Metadata already exists for this mint.');
  }

  // ---- Create Metadata (mutable for now; you can lock later)
  const { signature } = await createMetadataAccountV3(umi, {
    mint,
    mintAuthority: signer,
    payer: signer,
    updateAuthority: signer,
    data: {
      name: trimmedName,
      symbol: trimmedSymbol,
      uri: trimmedUri,
      sellerFeeBasisPoints: 0,
      creators: none(),
      collection: none(),
      uses: none(),
    },
    isMutable: true,
    collectionDetails: none(),
  }).sendAndConfirm(umi);

  return signature.toString();
}
