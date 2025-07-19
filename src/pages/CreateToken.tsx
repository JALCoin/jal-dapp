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
  const connection = new Connection('https://solana-proxy-production.up.railway.app', 'confirmed');

  const [step, setStep] = useState(0);
  const [mint, setMint] = useState<PublicKey | null>(null);
  const [ata, setAta] = useState<PublicKey | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = (msg: string) => setLogs((prev) => [...prev, msg]);

  const runStep = useCallback(async () => {
    if (!publicKey || !sendTransaction) return;
    setLoading(true);
    setError(null);

    try {
      switch (step) {
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
          log(`📤 Mint account created: ${mintAccount.publicKey.toBase58()}`);
          log(`🔗 Tx: ${sig}`);
          break;
        }

        case 1: {
          if (!mint) throw new Error('Mint account not set');
          const tx = new Transaction().add(
            createInitializeMintInstruction(mint, 9, publicKey, null)
          );
          const sig = await sendTransaction(tx, connection);
          log(`✅ Mint initialized`);
          log(`🔗 Tx: ${sig}`);
          break;
        }

        case 2: {
          if (!mint) throw new Error('Mint account not set');
          const ataAddress = await getAssociatedTokenAddress(mint, publicKey);
          setAta(ataAddress);

          const tx = new Transaction().add(
            createAssociatedTokenAccountInstruction(publicKey, ataAddress, publicKey, mint)
          );
          const sig = await sendTransaction(tx, connection);
          log(`📦 ATA created: ${ataAddress.toBase58()}`);
          log(`🔗 Tx: ${sig}`);
          break;
        }

        case 3: {
          if (!mint || !ata) throw new Error('Mint or ATA not set');
          const tx = new Transaction().add(
            createMintToInstruction(mint, ata, publicKey, 1_000_000_000)
          );
          const sig = await sendTransaction(tx, connection);
          setTxSig(sig);
          log(`✅ Tokens minted`);
          log(`🔗 Tx: ${sig}`);
          break;
        }

        case 4: {
          log(`🎉 Token creation complete!`);
          break;
        }
      }

      setStep((s) => s + 1);
    } catch (err: any) {
      setError(err.message);
      log(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [step, mint, ata, publicKey, sendTransaction]);

  const reset = () => {
    setStep(0);
    setMint(null);
    setAta(null);
    setTxSig(null);
    setLogs([]);
    setError(null);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Step {step + 1}: {steps[step] || 'Done'}</h1>
        <button onClick={reset} className="text-xs text-red-500 underline">Reset</button>
      </div>

      {error && <p className="text-red-600 text-sm">❌ {error}</p>}

      <button
        onClick={runStep}
        disabled={loading || step >= steps.length}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Processing...' : step >= steps.length ? 'All Done' : 'Next Step ➡️'}
      </button>

      {mint && <p className="text-xs text-green-500 break-words">Mint: {mint.toBase58()}</p>}
      {ata && <p className="text-xs text-green-500 break-words">ATA: {ata.toBase58()}</p>}
      {txSig && (
        <a
          href={`https://explorer.solana.com/tx/${txSig}?cluster=mainnet`}
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
          {logs.map((msg, i) => <p key={i}>{msg}</p>)}
        </div>
      )}
    </div>
  );
};

export default CreateToken;
