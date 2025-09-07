// src/pages/CryptoGenerator.tsx
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction, // (InitializeMint2 also ok)
  createMintToInstruction,
} from "@solana/spl-token";
import { useNavigate, useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import TokenFinalizerModal from "../utils/TokenFinalizerModal";

/* ---------------------------------- */
const STEPS = [
  "Generate Token Mint",
  "Initialize Mint",
  "Create Token Account",
  "Mint Supply",
  "Attach Metadata",
  "Vault Complete",
] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;
const clampStep = (n: number): StepIndex => Math.max(0, Math.min(5, n)) as StepIndex;

// 👉 Adjust these defaults in your UI later:
const DECIMALS = 9;
const SUPPLY_UI = 1_000_000_000; // 1B tokens (example)
const SUPPLY_BASE = BigInt(SUPPLY_UI) * 10n ** BigInt(DECIMALS);

// Priority fee (micro-lamports per CU). Set to e.g. 10_000 for busy times; 0 disables.
const PRIORITY_MICROLAMPORTS = 0;

const rpcFromEnv =
  (typeof window !== "undefined" && (window as any).__SOLANA_RPC_ENDPOINT__) ||
  import.meta.env.VITE_SOLANA_RPC ||
  clusterApiUrl("mainnet-beta");
/* ---------------------------------- */

const CryptoGenerator: FC = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const connection = useMemo(() => new Connection(rpcFromEnv, "confirmed"), []);
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<StepIndex>(0);
  const [mint, setMint] = useState<PublicKey | null>(null);
  const [ata, setAta] = useState<PublicKey | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizer, setShowFinalizer] = useState(false);

  const log = (msg: string) => setLogs((prev) => [...prev, msg]);

  /* ---------- URL hash -> step (deep-link) ---------- */
  useEffect(() => {
    const m = location.hash.match(/#step(\d+)/);
    if (!m) return;
    const idx = Math.max(1, Math.min(STEPS.length, parseInt(m[1], 10))) - 1;
    setStep(clampStep(idx));
    log(`Jumped to step ${idx + 1}: ${STEPS[idx]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- keep hash in sync ---------- */
  useEffect(() => {
    const target = `#step${(step as number) + 1}`;
    if (location.hash !== target) {
      history.replaceState(null, "", `${location.pathname}${location.search}${target}`);
    }
  }, [step, location.pathname, location.search, location.hash]);

  /* ---------- helpers ---------- */
  const addPriority = (tx: Transaction) => {
    if (PRIORITY_MICROLAMPORTS > 0) {
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_MICROLAMPORTS })
      );
    }
  };

  const confirmTx = useCallback(
    async (sig: string) => {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
      const conf = await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      if (conf.value.err) throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);
      return sig;
    },
    [connection]
  );

  const withLink = (sig: string) => `https://solscan.io/tx/${sig}`;
  const tokenLink = (m: PublicKey) => `https://solscan.io/token/${m.toBase58()}`;

  const runStep = useCallback(async () => {
    if (!publicKey || !sendTransaction) return;
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      switch (step) {
        /* 1) Create a new mint account */
        case 0: {
          // Sanity: ensure payer has some SOL (rent + fees)
          const payerLamports = await connection.getBalance(publicKey, "processed");
          const rent = await getMinimumBalanceForRentExemptMint(connection);
          if (payerLamports < rent + 200_000) {
            throw new Error(
              `Insufficient SOL for rent (${(rent / 1e9).toFixed(4)} SOL) + fees`
            );
          }

          const mintAccount = Keypair.generate();
          setMint(mintAccount.publicKey);

          const createIx = SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mintAccount.publicKey,
            space: MINT_SIZE,
            lamports: rent,
            programId: TOKEN_PROGRAM_ID,
          });

          const tx = new Transaction();
          addPriority(tx);
          tx.add(createIx);
          tx.feePayer = publicKey;

          // Let wallet set recent blockhash; include mint signer
          const sig = await sendTransaction(tx, connection, { signers: [mintAccount] });
          await confirmTx(sig);

          log(`Mint created: ${mintAccount.publicKey.toBase58()}`);
          log(withLink(sig));
          break;
        }

        /* 2) Initialize mint (decimals, mint authority) */
        case 1: {
          if (!mint) throw new Error("Mint not set");
          const initIx = createInitializeMintInstruction(mint, DECIMALS, publicKey, null);

          const tx = new Transaction();
          addPriority(tx);
          tx.add(initIx);
          tx.feePayer = publicKey;

          const sig = await sendTransaction(tx, connection);
          await confirmTx(sig);

          log(`Mint initialized (decimals=${DECIMALS})`);
          log(withLink(sig));
          break;
        }

        /* 3) Create the user's associated token account (ATA) */
        case 2: {
          if (!mint) throw new Error("Mint not set");
          const ataAddr = await getAssociatedTokenAddress(mint, publicKey);
          setAta(ataAddr);

          const exists = await connection.getAccountInfo(ataAddr, "processed");
          if (exists) {
            log(`Token account already exists: ${ataAddr.toBase58()}`);
            break;
          }

          const createAtaIx = createAssociatedTokenAccountInstruction(
            publicKey, // payer
            ataAddr,   // ata
            publicKey, // owner
            mint
          );

          const tx = new Transaction();
          addPriority(tx);
          tx.add(createAtaIx);
          tx.feePayer = publicKey;

          const sig = await sendTransaction(tx, connection);
          await confirmTx(sig);

          log(`Token account created: ${ataAddr.toBase58()}`);
          log(withLink(sig));
          break;
        }

        /* 4) Mint initial supply to ATA */
        case 3: {
          if (!mint || !ata) throw new Error("Mint or ATA not set");

          // Guard against absurd values if UI changes
          if (SUPPLY_BASE <= 0n) throw new Error("Invalid supply amount");

          const mintToIx = createMintToInstruction(mint, ata, publicKey, SUPPLY_BASE);

          const tx = new Transaction();
          addPriority(tx);
          tx.add(mintToIx);
          tx.feePayer = publicKey;

          const sig = await sendTransaction(tx, connection);
          await confirmTx(sig);

          log(`Supply minted: ${SUPPLY_UI.toLocaleString()} (decimals=${DECIMALS})`);
          log(withLink(sig));
          if (mint) log(`Token: ${tokenLink(mint)}`);
          break;
        }

        /* 5) Attach metadata via modal (user fills name/symbol/uri) */
        case 4: {
          setShowFinalizer(true);
          return; // wait for modal
        }

        /* 6) Persist + done */
        case 5: {
          if (mint && ata) {
            localStorage.setItem("mint", mint.toBase58());
            localStorage.setItem("ata", ata.toBase58());
            log("Token generation complete.");
          }
          break;
        }
      }

      setStep((s) => clampStep(s + 1));
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      log(`Error: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [step, mint, ata, publicKey, sendTransaction, connection, loading, confirmTx]);

  const reset = () => {
    setStep(0);
    setMint(null);
    setAta(null);
    setLogs([]);
    setError(null);
    setShowFinalizer(false);
  };

  const goToVault = () => navigate("/?panel=vault");

  const handleMetadataSuccess = (mintStr: string) => {
    log(`Metadata attached to ${mintStr}`);
    setShowFinalizer(false);
    setStep((s) => clampStep(s + 1));
  };

  return (
    <main className="min-h-screen flex items-start justify-center py-20 px-4">
      <div className="w-full max-w-xl space-y-6" id={`step${(step as number) + 1}`}>
        {/* Wallet */}
        <div className="flex justify-center mb-6">
          <WalletMultiButton />
        </div>

        {/* Step header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Step {(step as number) + 1}: {STEPS[step] || "Complete"}
          </h1>
          <button onClick={reset} className="text-xs underline" style={{ color: "#f66" }}>
            Reset
          </button>
        </div>

        {/* Status */}
        {!connected && <p className="muted">Connect a wallet to start generating a token.</p>}
        {error && (
          <p style={{ color: "#f66" }} className="text-sm">
            {error}
          </p>
        )}

        {/* Primary action */}
        {(step as number) < STEPS.length ? (
          <button
            onClick={runStep}
            disabled={loading || !publicKey}
            className="button"
            aria-busy={loading}
          >
            {loading ? "Processing…" : "Next Step"}
          </button>
        ) : (
          <div className="space-y-3 text-sm" style={{ color: "#11f1a7" }}>
            <p>
              <strong>Mint:</strong> {mint?.toBase58()}
            </p>
            {!!mint && (
              <p>
                <a
                  href={tokenLink(mint)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Solscan
                </a>
              </p>
            )}
            <button onClick={goToVault} className="button">
              Go to Vault
            </button>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="card" role="log" aria-live="polite">
            <p className="mb-2" style={{ color: "#11f1a7", fontWeight: 700 }}>
              Log
            </p>
            {logs.map((msg, i) => (
              <p key={i} className="text-sm" style={{ opacity: 0.95 }}>
                {msg}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Metadata modal */}
      {showFinalizer && mint && (
        <div className="hub-overlay" role="dialog" aria-modal="true">
          <div className="hub-panel hub-panel--fit hub-panel--overlay" style={{ maxWidth: 560 }}>
            <div className="hub-panel-top">
              <h2 className="hub-title">Attach Metadata</h2>
              <button className="wallet-disconnect-btn" onClick={() => setShowFinalizer(false)}>
                Close
              </button>
            </div>
            <div className="hub-panel-body">
              <TokenFinalizerModal
                mint={mint.toBase58()}
                connection={connection}
                onClose={() => setShowFinalizer(false)}
                onSuccess={handleMetadataSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CryptoGenerator;
