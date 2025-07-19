import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  Transaction,
  SystemProgram,
  Keypair,
  PublicKey,
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
  'Derive ATA',
  'Create ATA',
  'Mint Tokens',
  'Confirm Transaction',
];

export const CreateToken: FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const connection = new Connection('https://jal-dapp.vercel.app/api/solana', 'confirmed');

  const [currentStep, setCurrentStep] = useState(() => Number(localStorage.getItem('currentStep')) || 0);
  const [mint, setMint] = useState<Keypair | null>(null);
  const [ata, setAta] = useState<PublicKey | null>(null);
  const [lamports, setLamports] = useState<number>(0);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('currentStep', currentStep.toString());
  }, [currentStep]);

  const log = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const confirmTx = async (sig: string) => {
    log(`📤 Sent: ${sig}`);
    const start = Date.now();
    const timeout = 30000;

    while (Date.now() - start < timeout) {
      const { value } = await connection.getSignatureStatus(sig);
      if (value?.confirmationStatus === 'confirmed' || value?.confirmationStatus === 'finalized') {
        log(`✅ Confirmed: ${sig}`);
        return sig;
      }
      await new Promise(res => setTimeout(res, 1000));
    }

    throw new Error(`Timeout. Not confirmed in 30s: ${sig}`);
  };

  const generateMintKeypair = () => {
    const mintKeypair = Keypair.generate();
    setMint(mintKeypair);
    log(`🔐 Mint Generated: ${mintKeypair.publicKey.toBase58()}`);
    setCurrentStep(1);
  };

  const runStep = useCallback(async () => {
    if (!publicKey || !signTransaction) return;
    if (!mint && currentStep > 0) {
      setError('Mint keypair is missing');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      switch (currentStep) {
        case 1: {
          const rent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
          setLamports(rent);
          log(`💸 Rent Exemption: ${rent} lamports`);
          break;
        }
        case 2: {
          const tx = new Transaction().add(
            SystemProgram.createAccount({
              fromPubkey: publicKey,
              newAccountPubkey: mint!.publicKey,
              space: MINT_SIZE,
              lamports,
              programId: TOKEN_PROGRAM_ID,
            })
          );
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.partialSign(mint!);
          const signedTx = await signTransaction(tx);
          const sig = await connection.sendRawTransaction(signedTx.serialize());
          await confirmTx(sig);
          break;
        }
        case 3: {
          const tx = new Transaction().add(
            createInitializeMintInstruction(mint!.publicKey, 9, publicKey, null)
          );
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.partialSign(mint!);
          const signedTx = await signTransaction(tx);
          const sig = await connection.sendRawTransaction(signedTx.serialize());
          await confirmTx(sig);
          break;
        }
        case 4: {
          const ataAddr = await getAssociatedTokenAddress(mint!.publicKey, publicKey);
          setAta(ataAddr);
          log(`📦 ATA Derived: ${ataAddr.toBase58()}`);
          break;
        }
        case 5: {
          const tx = new Transaction().add(
            createAssociatedTokenAccountInstruction(publicKey, ata!, publicKey, mint!.publicKey)
          );
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signedTx = await signTransaction(tx);
          const sig = await connection.sendRawTransaction(signedTx.serialize());
          await confirmTx(sig);
          break;
        }
        case 6: {
          const tx = new Transaction().add(
            createMintToInstruction(mint!.publicKey, ata!, publicKey, 1_000_000_000)
          );
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signedTx = await signTransaction(tx);
          const sig = await connection.sendRawTransaction(signedTx.serialize());
          await confirmTx(sig);
          break;
        }
        case 7: {
          setTxSignature(mint!.publicKey.toBase58());
          log(`✅ Token Minted: ${mint!.publicKey.toBase58()}`);
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
  }, [currentStep, mint, ata, lamports, publicKey, signTransaction]);

  const resetFlow = () => {
    setCurrentStep(0);
    setMint(null);
    setAta(null);
    setLamports(0);
    setTxSignature(null);
    setError(null);
    setLogs([]);
    localStorage.removeItem('currentStep');
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Step {currentStep + 1}: {steps[currentStep]}</h1>
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

      <div className="flex gap-4">
        <button
          onClick={goBack}
          disabled={currentStep === 0 || loading}
          className="bg-gray-600 px-4 py-2 text-white rounded disabled:opacity-50"
        >
          ⬅ Back
        </button>
        {currentStep === 0 ? (
          <button
            onClick={generateMintKeypair}
            className="bg-blue-600 px-4 py-2 text-white rounded"
          >
            🔐 Generate Mint Keypair
          </button>
        ) : (
          <button
            onClick={runStep}
            disabled={loading || !publicKey || currentStep >= steps.length}
            className="bg-black px-4 py-2 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Processing...' : currentStep >= steps.length ? 'All Done' : 'Next Step ➡️'}
          </button>
        )}
      </div>

      {txSignature && (
        <div className="text-green-600 text-sm break-words">
          <p>{txSignature}</p>
          <a
            href={`https://explorer.solana.com/address/${txSignature}?cluster=mainnet`}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
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
