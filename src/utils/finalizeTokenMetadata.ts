import {
  createMetadataAccountV3,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { none } from '@metaplex-foundation/umi';

/**
 * Finalizes token metadata on-chain using Metaplex v3.4.0
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
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
  mintAddress: PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
}): Promise<string> {
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintAddress.toBuffer(),
    ],
    MPL_TOKEN_METADATA_PROGRAM_ID
  );

  const ix = createMetadataAccountV3({
    metadata: metadataPda,
    mint: mintAddress,
    mintAuthority: walletPublicKey,
    payer: walletPublicKey,
    updateAuthority: walletPublicKey,
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
    collectionDetails: none(),
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = walletPublicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  const sig = await sendTransaction(tx, connection);
  await connection.confirmTransaction(sig, 'confirmed');

  return sig;
}
