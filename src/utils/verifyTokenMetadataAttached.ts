import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import type { PublicKey as Web3PublicKey } from '@solana/web3.js';

export async function verifyTokenMetadataAttached(
  _: unknown,
  mintAddress: Web3PublicKey
): Promise<{
  isAttached: boolean;
  name?: string;
  symbol?: string;
  uri?: string;
  rawData?: any;
}> {
  try {
    const umi = createUmi('https://api.mainnet-beta.solana.com');
    const metadata = await fetchMetadataFromSeeds(umi, {
      mint: publicKey(mintAddress.toBase58()),
    });

    return {
      isAttached: true,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      rawData: metadata,
    };
  } catch (error) {
    console.error('Metadata fetch failed', error);
    return { isAttached: false };
  }
}
