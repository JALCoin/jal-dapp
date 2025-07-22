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

  // 1. Upload image to Lighthouse
  const imageUpload = await lighthouse.upload(
    data.imageFile!,
    lighthouseApiKey,
    undefined,
    (progress: { percentage: number }) =>
      console.log(`Uploading image: ${progress.percentage}%`)
  );

  const imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageUpload.data.Hash}`;

  // 2. Construct metadata JSON
  const metadataJson = JSON.stringify({
    name: data.name,
    symbol: data.symbol,
    description: data.description,
    image: imageUrl,
  });

  // 3. Upload metadata.json to Lighthouse
  const metadataUpload = await lighthouse.uploadText(metadataJson, lighthouseApiKey);
  const metadataUri = `https://gateway.lighthouse.storage/ipfs/${metadataUpload.data.Hash}`;

  // 4. Setup Umi + PDA
  const umi = createUmi(connection.rpcEndpoint).use(
    walletAdapterIdentity(wallet as any)
  );
  const mintKey = publicKey(mint);
  const metadataPda = findMetadataPda(umi, { mint: mintKey });

  // 5. Create metadata onchain
  await createMetadataAccountV3(umi, {
    metadata: metadataPda,
    mint: mintKey,
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
