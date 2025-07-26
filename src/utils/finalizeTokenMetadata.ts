// src/utils/finalizeTokenMetadata.ts
import {
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  DataV2,
} from '@metaplex-foundation/mpl-token-metadata';
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

  const buildTx = async (useUpdate: boolean) => {
    const tx = new Transaction();

    const ix = useUpdate
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
      : createCreateMetadataAccountV2Instruction(
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

    tx.add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.feePayer = walletPublicKey;
    tx.recentBlockhash = blockhash;
    return tx;
  };

  try {
    const tx = await buildTx(false); // try to create
    return await sendTransaction(tx, connection, { skipPreflight: true });
  } catch (e: any) {
    const msg = e.message || '';
    const alreadyInit = msg.includes('0x4b') || msg.includes('Error Number: 75');

    if (alreadyInit) {
      console.warn('Metadata already exists. Updating instead.');
      const tx = await buildTx(true); // fallback to update
      return await sendTransaction(tx, connection, { skipPreflight: true });
    }

    throw e;
  }
}
