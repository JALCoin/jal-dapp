// ✅ JAL CreateToken Flow (Step-by-Step, Resumable, Animated)

import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  Transaction,
  SystemProgram,
  Keypair,
  PublicKey
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

export const CreateToken: FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const connection = new Connection('https://jal-dapp.vercel.app/api/solana', 'confirmed');

  const [currentStep, setCurrentStep] = useState<number>(() => Number(localStorage.getItem('currentStep')) || 0);
  const [mint, setMint] = useState<Keypair | null>(null);
  const [ata, setAta] = useState<PublicKey | null>(null);
  const [lamports, setLamports] = useState<number>(0);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('currentStep', currentStep.toString());
  }, [currentStep]);

  const confirmTx = async (sig: string) => {
    setInfo(`Transaction submitted. Signature: ${sig}`);
    const confirmation = await connection.confirmTransaction(sig, 'confirmed');
    if (confirmation.value.err) throw new Error('Transaction failed');
    setInfo(`✅ Confirmed. Tx: ${sig}`);
    return sig;
  };

  const generateMintKeypair = () => {
    const mintKeypair = Keypair.generate();
    setMint(mintKeypair);
    setInfo(`Mint Address: ${mintKeypair.publicKey.toBase58()}`);
    setCurrentStep((prev) => prev + 1);
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
          setInfo(`Rent required: ${rent} lamports`);
          break;
        }
        case 2: {
          const ix = SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mint!.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          });
          const tx = new Transaction().add(ix);
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.partialSign(mint!);
          const signed = await signTransaction(tx);
          const raw = signed.serialize();
          const sig = await connection.sendRawTransaction( raw);
          await confirmTx(sig);
          break;
        }
        case 3: {
          const ix = createInitializeMintInstruction(mint!.publicKey, 9, publicKey, null);
          const tx = new Transaction().add(ix);
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.partialSign(mint!);
          const signed = await signTransaction(tx);
          const sig = await connection.sendRawTransaction(signed.serialize());
          await confirmTx(sig);
          break;
        }
        case 4: {
          const ataAddr = await getAssociatedTokenAddress(mint!.publicKey, publicKey);
          setAta(ataAddr);
          setInfo(`ATA: ${ataAddr.toBase58()}`);
          break;
        }
        case 5: {
          const ix = createAssociatedTokenAccountInstruction(publicKey, ata!, publicKey, mint!.publicKey);
          const tx = new Transaction().add(ix);
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signed = await signTransaction(tx);
          const sig = await connection.sendRawTransaction(signed.serialize());
          await confirmTx(sig);
          break;
        }
        case 6: {
          const ix = createMintToInstruction(mint!.publicKey, ata!, publicKey, 1_000_000_000);
          const tx = new Transaction().add(ix);
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signed = await signTransaction(tx);
          const sig = await sendRawTransaction(connection, signed.serialize());
          await confirmTx(sig);
          break;
        }
        case 7: {
          setTxSignature(`Completed. Mint: ${mint!.publicKey.toBase58()}`);
          setInfo(`✅ Token Minted Successfully!`);
          break;
        }
      }
      setCurrentStep((prev) => prev + 1);
    } catch (err: any) {
      console.error('Error at step', currentStep, err);
      setError(err.message || 'Step failed');
    } finally {
      setLoading(false);
    }
  }, [currentStep, publicKey, signTransaction, mint, lamports, ata]);

  const resetFlow = () => {
    setCurrentStep(0);
    setMint(null);
    setAta(null);
    setLamports(0);
    setTxSignature(null);
    setError(null);
    setInfo('');
    localStorage.removeItem('currentStep');
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 transition-all duration-500 ease-in-out">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Step {currentStep + 1}: {steps[currentStep]}</h1>
        <button onClick={resetFlow} className="text-xs underline text-red-500">Reset</button>
      </div>

      <div className="flex space-x-1 mb-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-full rounded-full transition-all duration-300 ${
              i === currentStep ? 'bg-yellow-400 animate-pulse' :
              i < currentStep ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {info && <p className="text-sm bg-gray-100 p-2 rounded animate-fade-in transition-opacity duration-300">{info}</p>}
      {error && <p className="text-red-600 text-sm animate-fade-in transition-opacity duration-300">Error: {error}</p>}

      <div className="flex space-x-4">
        <button
          onClick={goBack}
          disabled={currentStep === 0 || loading}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          ⬅ Back
        </button>

        {currentStep === 0 ? (
          <button
            onClick={generateMintKeypair}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            🔐 Generate Mint Keypair
          </button>
        ) : (
          <button
            onClick={runStep}
            disabled={!publicKey || loading || currentStep >= steps.length}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Processing...' : currentStep >= steps.length ? 'All Done' : 'Next Step ➡️'}
          </button>
        )}
      </div>

      {txSignature && (
        <div className="text-green-600 text-sm break-words">
          <p>{txSignature}</p>
          <a
            href={`https://explorer.solana.com/address/${mint!.publicKey.toBase58()}?cluster=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Solana Explorer
          </a>
        </div>
      )}
    </div>
  );
};

export default CreateToken;
