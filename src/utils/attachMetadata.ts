import { Connection } from '@solana/web3.js';
import {
  createMetadataAccountV3,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import type { WalletContextState } from '@solana/wallet-adapter-react';

export async function attachMetadata({
  mint,
  metadataUri,
  connection,
  wallet,
}: {
  mint: string;
  metadataUri: string;
  connection: Connection;
  wallet: WalletContextState;
}) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected or missing signer.');
  }

  const umi = createUmi(connection.rpcEndpoint).use(
    walletAdapterIdentity(wallet as any)
  );

  const mintPubkey = umiPublicKey(mint);
  const metadataPda = findMetadataPda(umi, { mint: mintPubkey });

  await createMetadataAccountV3(umi, {
    metadata: metadataPda,
    mint: mintPubkey,
    mintAuthority: umi.identity,
    updateAuthority: umi.identity,
    payer: umi.identity,
    data: {
      name: 'Token',
      symbol: '',
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

  return { success: true, metadataUri };
}
