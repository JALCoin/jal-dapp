import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export const finalizeTokenMetadata = async (
  connection: Connection,
  walletPublicKey: PublicKey,
  mint: PublicKey,
  metadataUri: string,
  name: string,
  symbol: string
) => {
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const accounts = {
    metadata: metadataPda,
    mint,
    mintAuthority: walletPublicKey,
    payer: walletPublicKey,
    updateAuthority: walletPublicKey,
  };

  const data = {
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const ix = createCreateMetadataAccountV3Instruction(
    accounts,
    {
      createMetadataAccountArgsV3: {
        data,
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [
    { publicKey: walletPublicKey, signTransaction: async () => tx }, // Wallet adapter will handle this in frontend
  ]);

  return sig;
};
