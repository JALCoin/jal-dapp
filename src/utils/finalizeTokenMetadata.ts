// src/utils/finalizeTokenMetadata.ts
import {
  createUmi,
  signerIdentity,
  publicKey,
} from '@metaplex-foundation/umi';
import { createMetadataAccountV3, findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { createBundledVrfClient } from '@metaplex-foundation/umi-bundle-defaults';
import { Connection, PublicKey } from '@solana/web3.js';

interface FinalizeMetadataParams {
  connection: Connection;
  walletPublicKey: PublicKey;
  mintAddress: PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
  // signer must implement UmiSigner from `@metaplex-foundation/umi`
  signer: any;
}

export async function finalizeTokenMetadata({
  connection,
  walletPublicKey,
  mintAddress,
  metadataUri,
  name,
  symbol,
  signer,
}: FinalizeMetadataParams): Promise<string> {
  const umi = createUmi(connection.rpcEndpoint).use(createBundledVrfClient());
  umi.use(signerIdentity(signer));

  const metadata = {
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const metadataPda = findMetadataPda(umi, publicKey(mintAddress.toBase58()));

  const { signature } = await createMetadataAccountV3(umi, {
    metadata: metadataPda,
    mint: publicKey(mintAddress.toBase58()),
    mintAuthority: signer,
    updateAuthority: signer,
    payer: signer,
    data: metadata,
    isMutable: true,
  }).sendAndConfirm(umi);

  return signature;
}
