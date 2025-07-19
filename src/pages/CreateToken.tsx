import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';

const steps = [
  'Create Mint',
  'Create Associated Token Account (ATA)',
  'Mint Tokens',
  'Done',
];

export const CreateToken: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  const [currentStep, setCurrentStep] = useState(0);
  const [mint, setMint] = useState<PublicKey | null>(null);
  const [ata, setAta] = useState<PublicKey | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => setLogs((prev) => [...prev, msg]);

  const runStep = useCallback(async () => {
    if (!publicKey || !sendTransaction) return;
    setError(null);
    setLoading(true);

    try {
      switch (currentStep) {
        case 0: {
          const mintAddress = await createMint(
            connection,
            publicKey, // fee payer
            publicKey, // mint authority
            null,      // no freeze authority
            9          // decimals
          );
          setMint(mintAddress);
          log(`🪙 Mint created: ${mintAddress.toBase58()}`);
          break;
        }
        case 1: {
          const ataAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            publicKey,
            mint!,
            publicKey
          );
          setAta(ataAccount.address);
          log(`📦 ATA created: ${ataAccount.address.toBase58()}`);
          break;
        }
        case 2: {
          const sig = await mintTo(
            connection,
            publicKey,
            mint!,
            ata!,
            publicKey,
            1_000_000_000 // 1B tokens (with 9 decimals)
          );
          setTxSignature(sig);
          log(`✅ Minted 1B tokens: ${sig}`);
          break;
        }
        case 3: {
          log(`🎉 Token setup complete`);
          break;
        }
      }

      setCurrentStep((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message);
      log(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [connection, currentStep, mint, ata, publicKey, sendTransaction]);

  const resetFlow = () => {
    setCurrentStep(0);
    setMint(null);
    setAta(null);
    setTxSignature(null);
    setError(null);
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Step {currentStep + 1}: {steps[currentStep] || 'Done'}</h1>
        <button onClick={resetFlow} className="text-xs text-red-500 underline">Reset</button>
      </div>

      <div className="flex space-x-1 mb-3">
        {steps.map((_, i) => (
          <div key={i} className={`h-2 w-full rounded-full ${
            i === currentStep ? 'bg-yellow-400 animate-pulse' :
            i < currentStep ? 'bg-green-500' : 'bg-gray-300'
          }`} />
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">❌ {error}</p>}

      <button
        onClick={runStep}
        disabled={loading || currentStep >= steps.length}
        className="bg-black px-4 py-2 text-white rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Processing...' : currentStep >= steps.length ? 'All Done' : 'Next Step ➡️'}
      </button>

      {mint && (
        <p className="text-xs text-green-500 break-words">Mint Address: {mint.toBase58()}</p>
      )}

      {ata && (
        <p className="text-xs text-green-500 break-words">Token Account: {ata.toBase58()}</p>
      )}

      {txSignature && (
        <a
          href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 underline"
        >
          View Transaction
        </a>
      )}

      {logs.length > 0 && (
        <div className="bg-black text-white text-xs p-3 rounded max-h-64 overflow-y-auto font-mono">
          <p className="text-green-400 font-bold mb-2">🪵 Transaction Log</p>
          {logs.map((entry, i) => (
            <p key={i}>{entry}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateToken;
