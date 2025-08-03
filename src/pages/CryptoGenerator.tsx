import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection, Keypair, PublicKey, SystemProgram, Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress, createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction, createMintToInstruction,
} from '@solana/spl-token';
import { useNavigate, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TokenFinalizerModal from '../utils/TokenFinalizerModal';

const steps = [
  'Generate Token Mint',
  'Initialize Mint',
  'Create Token Account',
  'Mint Supply',
  'Attach Metadata',
  'Vault Complete',
];

const CryptoGenerator: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const connection = useMemo(
    () => new Connection('https://solana-proxy-production.up.railway.app', 'confirmed'),
    []
  );
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(0);
  const [mint, setMint] = useState<PublicKey | null>(null);
  const [ata, setAta] = useState<PublicKey | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizer, setShowFinalizer] = useState(false);

  const log = (msg: string) => setLogs((prev) => [...prev, msg]);

  useEffect(() => {
    if (!location.hash) return;
    const match = location.hash.match(/#step(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10) - 1;
      if (index >= 0 && index < steps.length) {
        setStep(index);
        log(`Jumped to step ${index + 1}: ${steps[index]}`);
      }
    }
  }, [location]);

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
          log(`Mint created: ${mintAccount.publicKey.toBase58()}`);
          log(`https://solscan.io/tx/${sig}`);
          break;
        }

        case 1: {
          if (!mint) throw new Error('Mint not set');
          const tx = new Transaction().add(
            createInitializeMintInstruction(mint, 9, publicKey, null)
          );
          const sig = await sendTransaction(tx, connection);
          log(`Mint initialized`);
          log(`https://solscan.io/tx/${sig}`);
          break;
        }

        case 2: {
          if (!mint) throw new Error('Mint not set');
          const ataAddress = await getAssociatedTokenAddress(mint, publicKey);
          setAta(ataAddress);

          const tx = new Transaction().add(
            createAssociatedTokenAccountInstruction(publicKey, ataAddress, publicKey, mint)
          );
          const sig = await sendTransaction(tx, connection);
          log(`Token account created: ${ataAddress.toBase58()}`);
          log(`https://solscan.io/tx/${sig}`);
          break;
        }

        case 3: {
          if (!mint || !ata) throw new Error('Mint or ATA not set');
          const amount = BigInt('1000000000000000000');
          const tx = new Transaction().add(
            createMintToInstruction(mint, ata, publicKey, amount)
          );
          const sig = await sendTransaction(tx, connection);
          log(`Supply minted`);
          log(`https://solscan.io/tx/${sig}`);
          break;
        }

        case 4: {
          setShowFinalizer(true);
          return;
        }

        case 5: {
          if (mint && ata) {
            localStorage.setItem('mint', mint.toBase58());
            localStorage.setItem('ata', ata.toBase58());
            log(`Token generation complete.`);
          }
          break;
        }
      }

      setStep((s) => s + 1);
    } catch (err: any) {
      log(`Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [step, mint, ata, publicKey, sendTransaction]);

  const reset = () => {
    setStep(0);
    setMint(null);
    setAta(null);
    setLogs([]);
    setError(null);
    setShowFinalizer(false);
  };

  const goToDashboard = () => navigate('/dashboard');

  const handleMetadataSuccess = (mint: string) => {
    log(`Metadata attached to ${mint}`);
    setStep((s) => s + 1);
    setShowFinalizer(false);
  };

  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] flex items-start justify-center py-20 px-4">
      <div className="w-full max-w-xl space-y-6" id={`step${step + 1}`}>      
        <div className="flex justify-center mb-6">
          <WalletMultiButton />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Step {step + 1}: {steps[step] || 'Complete'}
          </h1>
          <button onClick={reset} className="text-xs text-red-500 underline">Reset</button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {step < steps.length ? (
          <button onClick={runStep} disabled={loading || !publicKey} className="button">
            {loading ? 'Processing...' : 'Next Step'}
          </button>
        ) : (
          <div className="space-y-3 text-sm text-green-600">
            <p><strong>Mint:</strong> {mint?.toBase58()}</p>
            <p>
              <a
                href={`https://solscan.io/token/${mint?.toBase58()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View on Solscan
              </a>
            </p>
            <button onClick={goToDashboard} className="button">Go to Vault</button>
          </div>
        )}

        {logs.length > 0 && (
          <div className="log-box">
            <p className="text-[var(--jal-green)] font-bold mb-2">Log</p>
            {logs.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        )}
      </div>

      {showFinalizer && mint && (
        <div className="modal-overlay">
          <TokenFinalizerModal
            mint={mint.toBase58()}
            connection={connection}
            onClose={() => setShowFinalizer(false)}
            onSuccess={handleMetadataSuccess}
          />
        </div>
      )}
    </main>
  );
};

export default CryptoGenerator;
