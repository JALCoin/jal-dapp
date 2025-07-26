import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  Metadata,
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
    const [metadataPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintAddress.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(metadataPda);
    if (!accountInfo) return { isAttached: false };

    const [metadata] = Metadata.deserialize(accountInfo.data);
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
