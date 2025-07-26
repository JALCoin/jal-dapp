import {
  createCreateMetadataAccountV2Instruction,
  DataV2,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

export async function finalizeTokenMetadata({
  connection,
  sendTransaction,
  walletPublicKey,
  mintAddress,
  metadataUri,
  name,
  symbol,
}: {
  connection: Connection;
  sendTransaction: any;
  walletPublicKey: PublicKey;
  mintAddress: PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
}): Promise<string> {
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

  const ix = createCreateMetadataAccountV2Instruction(
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

  const blockhash = await connection.getLatestBlockhash('finalized');
  const tx = new Transaction({
    feePayer: walletPublicKey,
    recentBlockhash: blockhash.blockhash,
  }).add(ix);

  const sig = await sendTransaction(tx, connection, {
    preflightCommitment: 'confirmed',
  });

  await connection.confirmTransaction(
    {
      signature: sig,
      ...blockhash,
    },
    'finalized'
  );

  return sig;
}
