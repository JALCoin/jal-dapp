// src/utils/finalizeTokenMetadata.ts
import {
  createMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import type { DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';

interface FinalizeMetadataParams {
  connection: Connection;
  walletPublicKey: PublicKey;
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: { skipPreflight?: boolean }
  ) => Promise<string>;
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

  const buildTransaction = async (update: boolean) => {
    const tx = new Transaction();

    const ix = update
      ? createUpdateMetadataAccountV2Instruction(
          {
            metadata: metadataPda,
            updateAuthority: walletPublicKey,
          },
          {
            updateMetadataAccountArgsV2: {
              data: metadata,
              updateAuthority: walletPublicKey,
              primarySaleHappened: null,
              isMutable: true,
            },
          }
        )
      : createMetadataAccountV3Instruction(
          {
            metadata: metadataPda,
            mint: mintAddress,
            mintAuthority: walletPublicKey,
            payer: walletPublicKey,
            updateAuthority: walletPublicKey,
          },
          {
            createMetadataAccountArgsV3: {
              data: metadata,
              isMutable: true,
              collectionDetails: null,
            },
          }
        );

    tx.add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.feePayer = walletPublicKey;
    tx.recentBlockhash = blockhash;

    return tx;
  };

  const trySend = async (tx: Transaction): Promise<string> => {
    return await sendTransaction(tx, connection, { skipPreflight: true });
  };

  // First try: create
  const createTx = await buildTransaction(false);
  try {
    return await trySend(createTx);
  } catch (err: any) {
    const msg = err.message || '';
    const isAlreadyInitialized = msg.includes('0x4b') || msg.includes('Error Number: 75');

    if (!isAlreadyInitialized) throw err;

    console.warn('Metadata already exists. Attempting to update...');
    const updateTx = await buildTransaction(true);
    return await trySend(updateTx);
  }
}
