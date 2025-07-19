import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
} from '@solana/spl-token';

const steps = [
  'Create Mint Account',
  'Initialize Mint',
  'Create ATA',
  'Mint Tokens',
  'Done',
];

export const CreateToken: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const connection = new Connection('https://jal-dapp.vercel.app/api/solana', 'confirmed');

  const [currentStep, setCurrentStep] = useState(0);
  const [mint, setMint] = useState<PublicKey | null>(null);
  const [ata, setAta] = useState<PublicKey | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
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
          const lamports = await getMinimumBalanceForRentExemptMint(connection);
          const mintAccount = Keypair.generate();
          setMint(mintAccount.publicKey);

          const tx = new Transaction().add(
            SystemProgram.createAccount({
              fromPubkey: publicKey,
              newAccountPubkey: mintAccount.publicKey,
              space: MINT_SIZE,
              lamports,
              programId: TOKEN_PROGRAM_ID,
            })
          );
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.partialSign(mintAccount);

          const sig = await sendTransaction(tx, connection, { signers: [mintAccount] });
          setTxSig(sig);
          log(`📤 Created mint account: ${mintAccount.publicKey.toBase58()}`);
          log(`🔗 Tx Signature: ${sig}`);
          break;
        }

        case 1: {
          const tx = new Transaction().add(
            createInitializeMintInstruction(mint!, 9, publicKey, null)
          );
          const sig = await sendTransaction(tx, connection);
          log(`✅ Mint initialized`);
          log(`🔗 Tx Signature: ${sig}`);
          break;
        }

        case 2: {
          const ataAddress = await getAssociatedTokenAddress(mint!, publicKey);
          setAta(ataAddress);

          const tx = new Transaction().add(
            createAssociatedTokenAccountInstruction(publicKey, ataAddress, publicKey, mint!)
          );
          const sig = await sendTransaction(tx, connection);
          log(`📦 ATA created: ${ataAddress.toBase58()}`);
          log(`🔗 Tx Signature: ${sig}`);
          break;
        }

        case 3: {
          const tx = new Transaction().add(
            createMintToInstruction(mint!, ata!, publicKey, 1_000_000_000)
          );
          const sig = await sendTransaction(tx, connection);
          setTxSig(sig);
          log(`✅ Minted tokens to ATA`);
          log(`🔗 Tx Signature: ${sig}`);
          break;
        }

        case 4: {
          log(`🎉 Token creation complete!`);
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
  }, [connection, currentStep, publicKey, mint, ata, sendTransaction]);

  const resetFlow = () => {
    setCurrentStep(0);
    setMint(null);
    setAta(null);
    setTxSig(null);
    setError(null);
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Step {currentStep + 1}: {steps[currentStep] || 'Done'}
        </h1>
        <button onClick={resetFlow} className="text-xs text-red-500 underline">
          Reset
        </button>
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
        <p className="text-xs text-green-500 break-words">Mint: {mint.toBase58()}</p>
      )}
      {ata && (
        <p className="text-xs text-green-500 break-words">ATA: {ata.toBase58()}</p>
      )}
      {txSig && (
        <a
          href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
          className="text-xs text-blue-400 underline"
          target="_blank"
          rel="noreferrer"
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
