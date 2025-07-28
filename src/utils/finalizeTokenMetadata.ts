import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey, none, signerIdentity } from '@metaplex-foundation/umi';
import type { Signer } from '@metaplex-foundation/umi';
import type { PublicKey as Web3PublicKey } from '@solana/web3.js';

interface Params {
  signer: Signer;
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
  const umi = createUmi('https://mainnet.helius-rpc.com/?api-key=53dbb893-4b85-4b5f-bcef-9dc42e5cacb2') // 🔁 Helius RPC
    .use(signerIdentity(signer));

  const mint = publicKey(mintAddress.toBase58());

  const builder = createMetadataAccountV3(umi, {
    mint,
    mintAuthority: signer,
    payer: signer,
    updateAuthority: signer,
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
    collectionDetails: none(), // Metaplex v3.4.0+
  });

  const { signature } = await builder.sendAndConfirm(umi);
  return signature.toString();
}
