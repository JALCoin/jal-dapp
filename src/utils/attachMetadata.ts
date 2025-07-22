import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  createCreateMetadataAccountV3Instruction,
  type CreateMetadataAccountArgsV3,
  PROGRAM_ID as METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import lighthouse from '@lighthouse-web3/sdk';
import type { FinalizeData } from '../components/FinalizeTokenAsNFT';

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
    (progress: number) => console.log(`Uploading image: ${progress}%`)
  );

  const imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageUpload.data.Hash}`;

  // 2. Prepare metadata JSON
  const metadataJSON = {
    name: data.name,
    symbol: data.symbol,
    description: data.description,
    image: imageUrl,
  };

  const metadataBlob = new Blob([JSON.stringify(metadataJSON)], {
    type: 'application/json',
  });

  const metadataText = await metadataBlob.text();
  const metadataUpload = await lighthouse.uploadText(metadataText, lighthouseApiKey);
  const metadataUri = `https://gateway.lighthouse.storage/ipfs/${metadataUpload.data.Hash}`;

  // 3. Prepare metadata account args
  const metadataArgs: CreateMetadataAccountArgsV3 = {
    data: {
      name: data.name,
      symbol: data.symbol,
      uri: metadataUri,
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
    },
    isMutable: true,
    collectionDetails: null,
  };

  // 4. Derive PDA
  const mintKey = new PublicKey(mint);
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mintKey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );

  // 5. Build transaction
  const ix = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: mintKey,
      mintAuthority: wallet.publicKey,
      payer: wallet.publicKey,
      updateAuthority: wallet.publicKey,
    },
    { createMetadataAccountArgsV3: metadataArgs }
  );

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
