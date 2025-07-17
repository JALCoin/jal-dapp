import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Transaction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
} from '@solana/spl-token';

const steps = [
  'Generate Mint Keypair',
  'Calculate Rent Exemption',
  'Create Mint Account',
  'Initialize Mint',
  'Derive Associated Token Account (ATA)',
  'Create ATA',
  'Mint Tokens',
  'Confirm Transaction',
];

type StepStatus = 'idle' | 'in-progress' | 'done' | 'error';

export const CreateToken: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    Array(steps.length).fill('idle')
  );
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateStep = (index: number, status: StepStatus) => {
    setStepStatuses((prev) => {
      const updated = [...prev];
      updated[index] = status;
      return updated;
    });
  };

  const handleCreateToken = useCallback(async () => {
    if (!publicKey || !signTransaction) return;

    const statuses = Array(steps.length).fill('idle');
    setStepStatuses(statuses);
    setError(null);
    setMintAddress(null);
    setLoading(true);

    try {
      // Step 1: Generate Mint Keypair
      updateStep(0, 'in-progress');
      const mint = Keypair.generate();
      updateStep(0, 'done');

      // Step 2: Calculate Rent
      updateStep(1, 'in-progress');
      const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      updateStep(1, 'done');

      // Step 3: Create Mint Account
      updateStep(2, 'in-progress');
      const createMintIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      });
      updateStep(2, 'done');

      // Step 4: Initialize Mint
      updateStep(3, 'in-progress');
      const initMintIx = createInitializeMintInstruction(
        mint.publicKey,
        9,
        publicKey,
        null
      );
      updateStep(3, 'done');

      // Step 5: Derive ATA
      updateStep(4, 'in-progress');
      const ata = await getAssociatedTokenAddress(mint.publicKey, publicKey);
      updateStep(4, 'done');

      // Step 6: Create ATA
      updateStep(5, 'in-progress');
      const createATAIx = createAssociatedTokenAccountInstruction(
        publicKey,
        ata,
        publicKey,
        mint.publicKey
      );
      updateStep(5, 'done');

      // Step 7: Mint Tokens
      updateStep(6, 'in-progress');
      const mintToIx = createMintToInstruction(
        mint.publicKey,
        ata,
        publicKey,
        1_000_000_000
      );
      updateStep(6, 'done');

      // Step 8: Finalize Transaction
      updateStep(7, 'in-progress');
      const tx = new Transaction().add(
        createMintIx,
        initMintIx,
        createATAIx,
        mintToIx
      );
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      tx.partialSign(mint);
      const signedTx = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(sig, 'confirmed');
      updateStep(7, 'done');

      setMintAddress(mint.publicKey.toBase58());
    } catch (err: any) {
      console.error('Minting failed:', err);
      setError(err.message || 'Minting failed');
      for (let i = 0; i < stepStatuses.length; i++) {
        if (stepStatuses[i] === 'in-progress') updateStep(i, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, signTransaction]);

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create SPL Token</h1>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full
              ${stepStatuses[i] === 'done' ? 'bg-green-500' :
                stepStatuses[i] === 'in-progress' ? 'bg-yellow-400 animate-pulse' :
                stepStatuses[i] === 'error' ? 'bg-red-500' :
                'bg-gray-300'}`}></div>
            <p className="text-sm">{step}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleCreateToken}
        disabled={!publicKey || loading}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Creating Token...' : 'Mint Token'}
      </button>

      {mintAddress && (
        <div className="text-green-600 break-all text-sm">
          <p className="font-medium">✅ Mint Address:</p>
          <a
            href={`https://explorer.solana.com/address/${mintAddress}?cluster=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {mintAddress}
          </a>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
};

export default CreateToken;
