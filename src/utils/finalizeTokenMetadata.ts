import type { DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { createCreateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

interface FinalizeMetadataParams {
  connection: Connection;
  walletPublicKey: PublicKey;
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
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

  const metadataData: DataV2 = {
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
        data: metadataData,
        isMutable: true,
      },
    }
  );

  const tx = new Transaction().add(ix);
  tx.feePayer = walletPublicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signature = await sendTransaction(tx, connection);

  const latestBlockhash = await connection.getLatestBlockhash('finalized');
  await connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    'finalized'
  );

  return signature;
}
