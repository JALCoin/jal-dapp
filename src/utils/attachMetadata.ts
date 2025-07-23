import {
  createMetadataAccountV3,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { publicKey } from '@metaplex-foundation/umi';
import type { WalletContextState } from '@solana/wallet-adapter-react';

export async function attachMetadata({
  metadataUri,
  mint,
  wallet,
}: {
  metadataUri: string;
  mint: string;
  wallet: WalletContextState;
}) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const umi = createUmi('https://api.mainnet-beta.solana.com').use(
    walletAdapterIdentity(wallet as any)
  );

  const mintPublicKey = publicKey(mint);
  const metadataPda = findMetadataPda(umi, { mint: mintPublicKey });

  await createMetadataAccountV3(umi, {
    metadata: metadataPda,
    mint: mintPublicKey,
    mintAuthority: umi.identity,
    updateAuthority: umi.identity,
    payer: umi.identity,
    data: {
      name: '', // left blank – metadata lives at the URI
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

  return { metadataUri };
}
