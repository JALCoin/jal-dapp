import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { findMetadataPda, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, Connection } from '@solana/web3.js';

export async function verifyTokenMetadataAttached(
  connection: Connection,
  mintAddress: PublicKey
): Promise<{
  isAttached: boolean;
  name?: string;
  symbol?: string;
  uri?: string;
  rawData?: any;
}> {
  try {
    const umi = createUmi('https://api.mainnet-beta.solana.com');
    const metadata = await fetchMetadataFromSeeds(umi, { mint: mintAddress });

    return {
      isAttached: true,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      rawData: metadata,
    };
  } catch (err) {
    console.error('Metadata fetch failed:', err);
    return { isAttached: false };
  }
}
