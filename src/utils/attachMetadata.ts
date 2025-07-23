// src/utils/attachMetadata.ts
import {
  createMetadataAccountV3,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { publicKey } from '@metaplex-foundation/umi';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';

export async function attachMetadata({
  metadataUri,
  mint,
  wallet,
  connection,
}: {
  metadataUri: string;
  mint: string;
  wallet: WalletContextState;
  connection: Connection;
}) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const umi = createUmi(connection.rpcEndpoint).use(walletAdapterIdentity(wallet as any));
  const mintPublicKey = publicKey(mint);
  const metadataPda = findMetadataPda(umi, { mint: mintPublicKey });

  await createMetadataAccountV3(umi, {
    metadata: metadataPda,
    mint: mintPublicKey,
    mintAuthority: umi.identity,
    updateAuthority: umi.identity,
    payer: umi.identity,
    data: {
      name: ' ',
      symbol: ' ',
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);
}
