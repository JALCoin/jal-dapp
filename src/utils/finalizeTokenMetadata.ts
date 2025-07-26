import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export async function finalizeTokenMetadata({
  connection,
  walletPublicKey,
  sendTransaction,
  mintAddress,
  metadataUri,
  name,
  symbol,
}: {
  connection: Connection;
  walletPublicKey: PublicKey;
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
  mintAddress: PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
}): Promise<string> {
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );

  const [metadataPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintAddress.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const data: DataV2 = {
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const ix: TransactionInstruction = createCreateMetadataAccountV2Instruction(
    {
      metadata: metadataPDA,
      mint: mintAddress,
      mintAuthority: walletPublicKey,
      payer: walletPublicKey,
      updateAuthority: walletPublicKey,
    },
    {
      createMetadataAccountArgsV2: {
        data,
        isMutable: true,
      },
    }
  );

  const tx = new Transaction().add(ix);
  tx.feePayer = walletPublicKey;

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  const sig = await sendTransaction(tx, connection);
  await connection.confirmTransaction(sig, 'confirmed');

  return sig;
}
