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
import { getRpcEndpoint } from '@/config/rpc';

type Params = {
  signer: Signer;
  mintAddress: Web3PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
};

/**
 * Creates the Token Metadata account (V3) for a new SPL mint.
 * - Uses your configured RPC via getRpcEndpoint()
 * - Validates inputs (name/symbol length, metadata URI)
 * - No-ops (throws) if metadata already exists on-chain
 *
 * Returns the confirmed transaction signature.
 */
export async function finalizeTokenMetadata({
  signer,
  mintAddress,
  metadataUri,
  name,
  symbol,
}: Params): Promise<string> {
  // --- Basic input validation to avoid on-chain failures
  const trimmedName = name?.trim();
  const trimmedSymbol = symbol?.trim();
  const trimmedUri = metadataUri?.trim();

  if (!trimmedName) throw new Error('Token name is required.');
  if (!trimmedSymbol) throw new Error('Token symbol is required.');
  if (!trimmedUri) throw new Error('Metadata URI is required.');
  if (!/^https?:\/\/|^ipfs:\/\//i.test(trimmedUri)) {
    throw new Error('Metadata URI must start with http(s):// or ipfs://');
  }
  // Metaplex metadata constraints (bytes; conservative checks)
  if (new TextEncoder().encode(trimmedName).length > 32) {
    throw new Error('Name must be ≤ 32 bytes.');
  }
  if (new TextEncoder().encode(trimmedSymbol).length > 10) {
    throw new Error('Symbol must be ≤ 10 bytes.');
  }

  // --- UMI client with your RPC + plugins
  const umi = createUmi(getRpcEndpoint())
    .use(mplTokenMetadata())
    .use(signerIdentity(signer));

  const mint = publicKey(mintAddress.toBase58());

  // --- Idempotency: if metadata already exists, stop early
  const existing = await fetchMetadataFromSeeds(umi, { mint }).catch(() => null);
  if (existing && existing.uri) {
    throw new Error('Metadata already exists for this mint.');
  }

  // --- Build + send the create instruction
  const builder = createMetadataAccountV3(umi, {
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
    // Keep mutable initially; you can lock later with an update if desired.
    isMutable: true,
    collectionDetails: none(),
  });

  const { signature } = await builder.sendAndConfirm(umi);
  return signature.toString();
}
