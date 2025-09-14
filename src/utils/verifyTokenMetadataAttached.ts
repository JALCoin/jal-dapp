import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import type { PublicKey as Web3PublicKey } from '@solana/web3.js';
import { getRpcEndpoint } from '../config/rpc';

export async function verifyTokenMetadataAttached(
  _conn: unknown,
  mintAddress: Web3PublicKey
): Promise<{ isAttached: boolean; name?: string; symbol?: string; uri?: string; rawData?: any }> {
  try {
    const umi = createUmi(getRpcEndpoint());
    const mint = publicKey(mintAddress.toBase58());

    const metadata = await fetchMetadataFromSeeds(umi, { mint }).catch(() => null);
    if (!metadata || !metadata.uri) return { isAttached: false };

    return {
      isAttached: true,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      rawData: metadata,
    };
  } catch (e) {
    console.error('❌ verify metadata error:', e);
    return { isAttached: false };
  }
}

/** Poll the PDA a few times to handle RPC lag. */
export async function waitForMetadataPda(
  conn: unknown,
  mintAddress: Web3PublicKey,
  { tries = 12, delayMs = 1500 } = {}
): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    const ok = (await verifyTokenMetadataAttached(conn, mintAddress)).isAttached;
    if (ok) return true;
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}
