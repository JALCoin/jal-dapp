import { Connection } from '@solana/web3.js';
import {
  createMetadataAccountV3,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { publicKey } from '@metaplex-foundation/umi';
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

  // 1. Upload image to Lighthouse with proper progress callback
  const imageUpload = await lighthouse.upload(
    data.imageFile!,
    lighthouseApiKey,
    undefined,
    (progressData) => console.log(`Uploading image: ${progressData.progress}%`)
  );

  const imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageUpload.data.Hash}`;

  // 2. Prepare metadata content
  const metadataContent = JSON.stringify({
    name: data.name,
    symbol: data.symbol,
    description: data.description,
    image: imageUrl,
  });

  // 3. Upload metadata.json to Lighthouse
  const metadataUpload = await lighthouse.uploadText(metadataContent, lighthouseApiKey);
  const metadataUri = `https://gateway.lighthouse.storage/ipfs/${metadataUpload.data.Hash}`;

  // 4. Set up Umi and find metadata PDA
  const umi = createUmi(connection.rpcEndpoint).use(
    walletAdapterIdentity(wallet as any)
  );
  const mintPublicKey = publicKey(mint);
  const metadataPda = findMetadataPda(umi, { mint: mintPublicKey });

  // 5. Create metadata account on chain
  await createMetadataAccountV3(umi, {
    metadata: metadataPda,
    mint: mintPublicKey,
    mintAuthority: umi.identity,
    updateAuthority: umi.identity,
    payer: umi.identity,
    data: {
      name: data.name,
      symbol: data.symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);

  return {
    metadataUri,
    imageUrl,
  };
}
