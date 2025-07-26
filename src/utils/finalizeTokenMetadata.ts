// src/utils/finalizeTokenMetadata.ts
import {
  createUmi,
  publicKey,
  signerIdentity,
  type Umi,
  type Signer,
} from '@metaplex-foundation/umi';
import {
  createMetadataAccountV3,
  findMetadataPda,
  type DataV2Args,
} from '@metaplex-foundation/mpl-token-metadata';
import { createBundledVrfClient } from '@metaplex-foundation/umi-bundle-defaults';
import { Connection, PublicKey } from '@solana/web3.js';

interface FinalizeMetadataParams {
  connection: Connection;
  mintAddress: PublicKey;
  metadataUri: string;
  name: string;
  symbol: string;
  signer: Signer;
}

export async function finalizeTokenMetadata({
  connection,
  mintAddress,
  metadataUri,
  name,
  symbol,
  signer,
}: FinalizeMetadataParams): Promise<string> {
  const umi: Umi = createUmi(connection.rpcEndpoint).use(createBundledVrfClient());
  umi.use(signerIdentity(signer));

  const metadata: DataV2Args = {
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const mint = publicKey(mintAddress.toBase58());
  const metadataPda = findMetadataPda(umi, mint);

  const { signature } = await createMetadataAccountV3(umi, {
    metadata: metadataPda,
    mint,
    mintAuthority: signer,
    updateAuthority: signer,
    payer: signer,
    data: metadata,
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);

  return signature;
}
