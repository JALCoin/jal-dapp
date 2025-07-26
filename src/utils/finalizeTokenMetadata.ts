import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
  CreateMetadataAccountArgsV3,
} from '@metaplex-foundation/mpl-token-metadata';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { none } from '@metaplex-foundation/umi';

/**
 * Finalizes token metadata on-chain via Phantom wallet.
 */
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
  sendTransaction: (tx: Transaction, conn: Connection) => Promise<string>;
  mintAddress: PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
}): Promise<string> {
  // Derive PDA for metadata account
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintAddress.toBuffer(),
    ],
    MPL_TOKEN_METADATA_PROGRAM_ID
  );

  // Format metadata struct for v3
  const metadataArgs: CreateMetadataAccountArgsV3 = {
    data: {
      name,
      symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: none(),
      collection: none(),
      uses: none(),
    },
    isMutable: true,
    collectionDetails: null,
  };

  const instruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPda,
      mint: mintAddress,
      mintAuthority: walletPublicKey,
      payer: walletPublicKey,
      updateAuthority: walletPublicKey,
    },
    {
      createMetadataAccountArgsV3: metadataArgs,
    }
  );

  const tx = new Transaction().add(instruction);
  tx.feePayer = walletPublicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  const signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}
