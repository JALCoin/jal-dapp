import type { DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import {
  createCreateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';

interface FinalizeMetadataParams {
  connection: Connection;
  walletPublicKey: PublicKey;
  sendTransaction: (transaction: Transaction, connection: Connection, options?: any) => Promise<string>;
  mintAddress: PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
}

export async function finalizeTokenMetadata({
  connection,
  walletPublicKey,
  sendTransaction,
  mintAddress,
  metadataUri,
  name,
  symbol,
}: FinalizeMetadataParams): Promise<string> {
  const [metadataPda] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintAddress.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const metadata: DataV2 = {
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const ix = createCreateMetadataAccountV2Instruction(
    {
      metadata: metadataPda,
      mint: mintAddress,
      mintAuthority: walletPublicKey,
      payer: walletPublicKey,
      updateAuthority: walletPublicKey,
    },
    {
      createMetadataAccountArgsV2: {
        data: metadata,
        isMutable: true,
      },
    }
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const tx = new Transaction().add(ix);
  tx.feePayer = walletPublicKey;
  tx.recentBlockhash = blockhash;

  const signature = await sendTransaction(tx, connection, {
    skipPreflight: true,
  });

  try {
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'finalized'
    );
  } catch (err) {
    console.error('Confirmation failed:', err);
    throw new Error('Blockhash expired. Please sign and submit quickly after clicking.');
  }

  return signature;
}
