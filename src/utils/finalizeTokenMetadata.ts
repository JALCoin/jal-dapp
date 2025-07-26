import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey, none } from '@metaplex-foundation/umi';
import type { KeypairSigner } from '@metaplex-foundation/umi';
import type { PublicKey as Web3PublicKey } from '@solana/web3.js';

interface Params {
  signer: KeypairSigner;
  mintAddress: Web3PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
}

export async function finalizeTokenMetadata({
  signer,
  mintAddress,
  metadataUri,
  name,
  symbol,
}: Params): Promise<string> {
  const umi = createUmi('https://api.mainnet-beta.solana.com').use(signer);
  const mint = publicKey(mintAddress.toBase58());

  const { signature } = await createMetadataAccountV3(umi, {
    mint,
    data: {
      name,
      symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: none(),
      collection: none(),
      uses: none(),
    },
    isMutable: false,
  }).sendAndConfirm(umi);

  return signature;
}
