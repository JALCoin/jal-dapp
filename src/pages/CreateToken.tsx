import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from '@solana/spl-token';

export const CreateToken: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateToken = useCallback(async () => {
    if (!publicKey) return;

    try {
      setLoading(true);

      const mintKeypair = Keypair.generate();
      const lamports = await connection.getMinimumBalanceForRentExemption(82);

      const createMintIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: 82,
        lamports,
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      const ata = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey
      );

      const createATAIx = createAssociatedTokenAccountInstruction(
        publicKey,
        ata,
        publicKey,
        mintKeypair.publicKey
      );

      const mintToIx = createMintToInstruction(
        mintKeypair.publicKey,
        ata,
        publicKey,
        100_000_000_000
      );

      const tx = new Transaction().add(
        createMintIx,
        createATAIx,
        mintToIx
      );

      const sig = await sendTransaction(tx, connection, {
        signers: [mintKeypair],
      });

      await connection.confirmTransaction(sig, 'confirmed');
      setMintAddress(mintKeypair.publicKey.toBase58());
    } catch (err) {
      console.error('Token creation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, sendTransaction]);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create SPL Token</h1>
      <button
        onClick={handleCreateToken}
        disabled={!publicKey || loading}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Mint Token'}
      </button>

      {mintAddress && (
        <p className="mt-4 text-green-600 break-all">
          Mint Address: <br /> {mintAddress}
        </p>
      )}
    </div>
  );
};

export default CreateToken;
