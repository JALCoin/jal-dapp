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
  // Metaplex V2 Limits
  const MAX_NAME = 32;
  const MAX_SYMBOL = 10;
  const MAX_URI = 200;

  const trimmedName = name.trim().slice(0, MAX_NAME);
  const trimmedSymbol = symbol.trim().slice(0, MAX_SYMBOL);
  const trimmedUri = metadataUri.trim().slice(0, MAX_URI);

  // Log for debugging
  console.log('Finalizing metadata with:');
  console.log('  Name:', trimmedName, '| Length:', trimmedName.length);
  console.log('  Symbol:', trimmedSymbol, '| Length:', trimmedSymbol.length);
  console.log('  URI:', trimmedUri, '| Length:', trimmedUri.length);

  const [metadataPda] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintAddress.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const metadata: DataV2 = {
    name: trimmedName,
    symbol: trimmedSymbol,
    uri: trimmedUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const instruction = createCreateMetadataAccountV2Instruction(
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

  const txBlockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction().add(instruction);
  transaction.feePayer = walletPublicKey;
  transaction.recentBlockhash = txBlockhash.blockhash;

  const signature = await sendTransaction(transaction, connection, {
    skipPreflight: true,
  });

  return signature;
}
