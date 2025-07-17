import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmRawTransaction,
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
  const connection = new Connection("https://jal-dapp.vercel.app/api/solana", "confirmed");

  const [currentStep, setCurrentStep] = useState(0);
  const [mint, setMint] = useState<Keypair | null>(null);
  const [ata, setAta] = useState<string>('');
  const [lamports, setLamports] = useState<number>(0);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string>('');

  const runStep = useCallback(async () => {
    if (!publicKey || !signTransaction) return;

    setError(null);
    setLoading(true);
    try {
      switch (currentStep) {
        case 0: {
          const mintKeypair = Keypair.generate();
          setMint(mintKeypair);
          setInfo(`Mint Address: ${mintKeypair.publicKey.toBase58()}`);
          break;
        }
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
          const sig = await sendAndConfirmRawTransaction(connection, signed.serialize());
          setInfo(`Mint account created. Tx: ${sig}`);
          break;
        }
        case 3: {
          const ix = createInitializeMintInstruction(mint!.publicKey, 9, publicKey, null);
          const tx = new Transaction().add(ix);
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.partialSign(mint!);
          const signed = await signTransaction(tx);
          const sig = await sendAndConfirmRawTransaction(connection, signed.serialize());
          setInfo(`Mint initialized. Tx: ${sig}`);
          break;
        }
        case 4: {
          const ataAddr = await getAssociatedTokenAddress(mint!.publicKey, publicKey);
          setAta(ataAddr.toBase58());
          setInfo(`ATA: ${ataAddr.toBase58()}`);
          break;
        }
        case 5: {
          const ix = createAssociatedTokenAccountInstruction(publicKey, ata, publicKey, mint!.publicKey);
          const tx = new Transaction().add(ix);
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signed = await signTransaction(tx);
          const sig = await sendAndConfirmRawTransaction(connection, signed.serialize());
          setInfo(`ATA created. Tx: ${sig}`);
          break;
        }
        case 6: {
          const ix = createMintToInstruction(mint!.publicKey, ata, publicKey, 1_000_000_000);
          const tx = new Transaction().add(ix);
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signed = await signTransaction(tx);
          const sig = await sendAndConfirmRawTransaction(connection, signed.serialize());
          setInfo(`Tokens minted. Tx: ${sig}`);
          break;
        }
        case 7: {
          setTxSignature(`Completed. Mint: ${mint!.publicKey.toBase58()}`);
          setInfo(`✅ Token Minted Successfully!`);
          break;
        }
        default:
          break;
      }
      setCurrentStep((prev) => prev + 1);
    } catch (err: any) {
      console.error('Error at step', currentStep, err);
      setError(err.message || 'Step failed');
    } finally {
      setLoading(false);
    }
  }, [currentStep, publicKey, signTransaction, mint, lamports, ata]);

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Step {currentStep + 1}: {steps[currentStep]}</h1>

      {info && <p className="text-sm bg-gray-100 p-2 rounded">{info}</p>}

      {error && <p className="text-red-600 text-sm">Error: {error}</p>}

      <button
        onClick={runStep}
        disabled={!publicKey || loading || currentStep >= steps.length}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Processing...' : currentStep >= steps.length ? 'All Done' : 'Next Step ➡️'}
      </button>

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
