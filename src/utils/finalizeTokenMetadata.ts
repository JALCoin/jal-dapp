import {
  createMetadataAccountV3,
  DataV2,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { PublicKey, Connection } from '@solana/web3.js';
import { KeypairSigner } from '@metaplex-foundation/umi';

interface Params {
  connection: Connection;
  signer: KeypairSigner;
  mintAddress: PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
}

export async function finalizeTokenMetadata({
  connection,
  signer,
  mintAddress,
  metadataUri,
  name,
  symbol,
}: Params): Promise<string> {
  const umi = createUmi('https://api.mainnet-beta.solana.com').use(signer);

  const metadata: DataV2 = {
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const tx = await createMetadataAccountV3(umi, {
    mint: mintAddress,
    data: metadata,
    isMutable: false,
  }).sendAndConfirm(umi);

  return tx.signature;
}
