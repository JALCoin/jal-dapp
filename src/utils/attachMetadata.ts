import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  createCreateMetadataAccountV3Instruction,
  DataV2,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import { WalletContextState } from '@solana/wallet-adapter-react';
import lighthouse from '@lighthouse-web3/sdk';
import type { FinalizeData } from '../components/FinalizeTokenAsNFT';

const LIGHTHOUSE_ENDPOINT = 'https://api.lighthouse.storage/api/v0';

export async function attachMetadata({
  data,
  mint,
  wallet,
  connection,
  lighthouseApiKey,
}: {
  data: FinalizeData;
  mint: string;
  wallet: WalletContextState;
  connection: Connection;
  lighthouseApiKey: string;
}) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  // 1. Upload image to Lighthouse
  const imageUpload = await lighthouse.upload(
    data.imageFile!,
    lighthouseApiKey,
    undefined,
    undefined,
    (progress) => console.log(`Uploading image: ${progress}%`)
  );

  const imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageUpload.data.Hash}`;

  // 2. Build metadata JSON
  const metadata: DataV2 = {
    name: data.name,
    symbol: data.symbol,
    uri: '', // to be filled after upload
    sellerFeeBasisPoints: 0,
    creators: [
      {
        address: wallet.publicKey.toBase58(),
        verified: true,
        share: 100,
      },
    ],
    collection: null,
    uses: null,
  };

  // 3. Upload metadata.json
  const blob = new Blob(
    [
      JSON.stringify({
        name: metadata.name,
        symbol: metadata.symbol,
        description: data.description,
        image: imageUrl,
      }),
    ],
    { type: 'application/json' }
  );

  const metadataUpload = await lighthouse.uploadText(
    await blob.text(),
    lighthouseApiKey
  );

  const metadataUri = `https://gateway.lighthouse.storage/ipfs/${metadataUpload.data.Hash}`;
  metadata.uri = metadataUri;

  // 4. Derive PDA and build instruction
  const mintKey = new PublicKey(mint);
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintKey.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  const ix = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: mintKey,
      mintAuthority: wallet.publicKey,
      payer: wallet.publicKey,
      updateAuthority: wallet.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: metadata,
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  // 5. Submit transaction
  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signedTx = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(sig, 'confirmed');

  return {
    metadataUri,
    imageUrl,
    txSignature: sig,
  };
}
