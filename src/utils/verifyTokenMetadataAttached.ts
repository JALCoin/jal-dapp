// src/utils/verifyTokenMetadataAttached.ts
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  findMetadataPda,
  fetchMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { Connection, PublicKey } from '@solana/web3.js';

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
    const metadataPda = findMetadataPda(mintAddress);

    const metadata = await fetchMetadata(connection, metadataPda);
    if (!metadata) return { isAttached: false };

    return {
      isAttached: true,
      name: metadata.data.name,
      symbol: metadata.data.symbol,
      uri: metadata.data.uri,
      rawData: metadata,
    };
  } catch (err) {
    console.error('Metadata verification failed:', err);
    return { isAttached: false };
  }
}
