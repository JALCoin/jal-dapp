// src/utils/verifyTokenMetadataAttached.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import type { PublicKey as Web3PublicKey } from '@solana/web3.js';
import { getRpcEndpoint } from '@/config/rpc';

export type VerifyResult = {
  /** true = metadata exists; false = not found; null = indeterminate (RPC error, etc.) */
  isAttached: boolean | null;
  name?: string;
  symbol?: string;
  uri?: string;
  rawData?: any;
  error?: string;
};

/**
 * Lightweight on-chain check for token metadata.
 * The first parameter is kept for backward compatibility and ignored.
 */
export async function verifyTokenMetadataAttached(
  _ignored: unknown,
  mintAddress: Web3PublicKey,
  endpoint: string = getRpcEndpoint()
): Promise<VerifyResult> {
  try {
    const umi = createUmi(endpoint);
    const mint = publicKey(mintAddress.toBase58());

    const md = await fetchMetadataFromSeeds(umi, { mint }).catch(() => null);
    if (!md || !md.uri) {
      return { isAttached: false };
    }

    return {
      isAttached: true,
      name: md.name,
      symbol: md.symbol,
      uri: md.uri,
      rawData: md,
    };
  } catch (e: any) {
    return {
      isAttached: null,
      error: e?.message ?? String(e),
    };
  }
}
