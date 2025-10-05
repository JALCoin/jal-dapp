// src/pages/CryptoGenerator.tsx
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
} from "@solana/spl-token";

import TokenFinalizerModal from "../utils/TokenFinalizerModal";
import { makeConnection } from "../config/rpc";

/* ----------------------------- Wizard steps ----------------------------- */
const STEPS = [
  "Generate Token Mint",
  "Initialize Mint",
  "Create Token Account",
  "Mint Supply",
  "Attach Metadata",
  "Vault Complete",
] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

const CryptoGenerator: FC = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const connection = useMemo(() => makeConnection("confirmed"), []);

  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<StepIndex>(0);

  // On-chain addrs
  const [mint, setMint] = useState<PublicKey | null>(null);
  const [ata, setAta] = useState<PublicKey | null>(null);

  // UI + ops
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizer, setShowFinalizer] = useState(false);

  // Token config (editable on step 1)
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supplyUi, setSupplyUi] = useState<number | "">("");

  // Persist small draft for refresh resilience
  useEffect(() => {
    const raw = localStorage.getItem("token_draft");
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (typeof d.name === "string") setName(d.name);
      if (typeof d.symbol === "string") setSymbol(d.symbol);
      if (typeof d.decimals === "number") setDecimals(d.decimals);
      if (typeof d.supplyUi === "number") setSupplyUi(d.supplyUi);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "token_draft",
      JSON.stringify({ name, symbol, decimals, supplyUi })
    );
  }, [name, symbol, decimals, supplyUi]);

  const parsedSupplyBase = useMemo(() => {
    if (supplyUi === "" || Number.isNaN(Number(supplyUi))) return null;
    try {
      return BigInt(supplyUi) * 10n ** BigInt(decimals);
    } catch {
      return null;
    }
  }, [supplyUi, decimals]);

  const log = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const nextStep = (s: StepIndex) => (Math.min(s + 1, 5) as StepIndex);

  const explorerTx = (sig: string) => `https://solscan.io/tx/${sig}`;
  const explorerToken = (m: string) => `https://solscan.io/token/${m}`;

  /* ---------- URL hash -> step (deep-link) ---------- */
  useEffect(() => {
    const m = location.hash.match(/#step(\d+)/);
    if (!m) return;
    const idx = Math.max(1, Math.min(STEPS.length, parseInt(m[1], 10))) - 1;
    setStep(idx as StepIndex);
    log(`Jumped to step ${idx + 1}: ${STEPS[idx]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- keep hash in sync ---------- */
  useEffect(() => {
    const target = `#step${(step as number) + 1}`;
    if (location.hash !== target) {
      window.history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}${target}`
      );
    }
  }, [step, location.pathname, location.search, location.hash]);

  const primaryLabel =
    step === 0 ? "Create Mint Account" :
    step === 1 ? "Initialize Mint" :
    step === 2 ? "Create Token Account" :
    step === 3 ? "Mint Initial Supply" :
    step === 4 ? "Attach Metadata" :
    "Finish";

  const runStep = useCallback(async () => {
    if (!publicKey || !sendTransaction || loading) return;

    setLoading(true);
    setError(null);

    try {
      switch (step) {
        // 1) Create a new mint account
        case 0: {
          const lamports = await getMinimumBalanceForRentExemptMint(connection);
          const mintAccount = Keypair.generate();
          setMint(mintAccount.publicKey);

          const ix = SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mintAccount.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          });

          const tx = new Transaction().add(ix);
          const sig = await sendTransaction(tx, connection, { signers: [mintAccount] });
          log(`Mint created: ${mintAccount.publicKey.toBase58()}`);
          log(explorerTx(sig));
          break;
        }

        // 2) Initialize mint
        case 1: {
          if (!mint) throw new Error("Mint not set");
          const ix = createInitializeMintInstruction(mint, decimals, publicKey, null);
          const tx = new Transaction().add(ix);
          const sig = await sendTransaction(tx, connection);
          log(`Mint initialized (decimals=${decimals})`);
          log(explorerTx(sig));
          break;
        }

        // 3) Create ATA for the user (if needed)
        case 2: {
          if (!mint) throw new Error("Mint not set");
          const ataAddr = await getAssociatedTokenAddress(mint, publicKey);
          setAta(ataAddr);

          const exists = await connection.getAccountInfo(ataAddr);
          if (exists) {
            log(`Token account already exists: ${ataAddr.toBase58()}`);
            break;
          }

          const ix = createAssociatedTokenAccountInstruction(
            publicKey,
            ataAddr,
            publicKey,
            mint
          );
          const tx = new Transaction().add(ix);
          const sig = await sendTransaction(tx, connection);
          log(`Token account created: ${ataAddr.toBase58()}`);
          log(explorerTx(sig));
          break;
        }

        // 4) Mint initial supply to ATA
        case 3: {
          if (!mint) throw new Error("Mint not set");
          if (parsedSupplyBase == null) throw new Error("Enter a valid initial supply.");

          const dest = ata ?? (await getAssociatedTokenAddress(mint, publicKey));
          setAta(dest);

          const ix = createMintToInstruction(mint, dest, publicKey, parsedSupplyBase);
          const tx = new Transaction().add(ix);
          const sig = await sendTransaction(tx, connection);
          log(`Supply minted: ${Number(supplyUi).toLocaleString()} (decimals=${decimals})`);
          log(explorerTx(sig));
          break;
        }

        // 5) Open metadata finalizer modal
        case 4: {
          setShowFinalizer(true);
          return; // advance occurs in onSuccess
        }

        // 6) Persist and finish
        case 5: {
          if (mint && ata) {
            localStorage.setItem("mint", mint.toBase58());
            localStorage.setItem("ata", ata.toBase58());
            localStorage.setItem(
              "token_draft",
              JSON.stringify({ name, symbol, decimals, supplyUi })
            );
            log("Token generation complete.");
          }
          break;
        }
      }

      setStep(nextStep);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      log(`Error: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    step, mint, ata, publicKey, sendTransaction, connection, loading,
    decimals, parsedSupplyBase, supplyUi, name, symbol
  ]);

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
    setStep(nextStep);
  };

  const isDone = step === STEPS.length - 1;

  return (
    <main className="crypto-generator">
      <div className="crypto-panel" id={`step${(step as number) + 1}`}>
        {/* Wallet */}
        <div className="flex justify-center mb-2">
          <WalletMultiButton />
        </div>

        {/* Header + mini stepper */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" aria-label="Progress">
            {STEPS.map((label, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <span
                  key={label}
                  className={`chip sm ${active ? "active" : ""}`}
                  aria-current={active ? "step" : undefined}
                  title={label}
                >
                  {done ? "✓" : i + 1}
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            {step > 0 && (
              <button
                className="button ghost"
                onClick={() => setStep((s) => (Math.max(0, (s as number) - 1) as StepIndex))}
              >
                Back
              </button>
            )}
            <button onClick={reset} className="text-xs underline" style={{ color: "#f66" }}>
              Reset
            </button>
          </div>
        </div>

        {/* Status */}
        {!connected && <p className="muted">Connect a wallet to start generating a token.</p>}
        {error && (
          <p className="text-sm" style={{ color: "#f66" }}>
            {error}
          </p>
        )}

        {/* Step 1 inputs */}
        {step === 0 && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Token Basics</h3>
            <div className="grid" style={{ display: "grid", gap: 12 }}>
              <label className="grid" style={{ gap: 6 }}>
                <span className="muted">Name</span>
                <input
                  className="shop-search"
                  placeholder="e.g. JAL Coin"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 32))}
                />
              </label>

              <label className="grid" style={{ gap: 6 }}>
                <span className="muted">Symbol</span>
                <input
                  className="shop-search"
                  placeholder="e.g. JAL"
                  value={symbol}
                  onChange={(e) =>
                    setSymbol(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
                    )
                  }
                />
              </label>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="grid" style={{ gap: 6 }}>
                  <span className="muted">Decimals (0–9)</span>
                  <input
                    className="shop-search"
                    type="number"
                    min={0}
                    max={9}
                    value={decimals}
                    onChange={(e) =>
                      setDecimals(Math.min(9, Math.max(0, Number(e.target.value) || 0)))
                    }
                  />
                </label>
                <label className="grid" style={{ gap: 6 }}>
                  <span className="muted">Initial Supply (UI units)</span>
                  <input
                    className="shop-search"
                    type="number"
                    min={0}
                    placeholder="e.g. 1000000000"
                    value={supplyUi}
                    onChange={(e) =>
                      setSupplyUi(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
                    }
                  />
                </label>
              </div>

              <div className="muted" style={{ fontSize: ".9rem" }}>
                {parsedSupplyBase != null
                  ? <>Minting <strong>{Number(supplyUi).toLocaleString()}</strong> tokens with <strong>{decimals}</strong> decimals.</>
                  : <>Enter a valid supply to continue.</>}
              </div>
            </div>
          </div>
        )}

        {/* Primary Action */}
        {!isDone ? (
          <button
            onClick={runStep}
            disabled={
              loading ||
              !publicKey ||
              (step === 0 && parsedSupplyBase == null)
            }
            className="button"
            aria-busy={loading}
          >
            {loading ? "Processing…" : primaryLabel}
          </button>
        ) : (
          <div className="card gold">
            <p className="mb-2"><strong>✅ Token Created</strong></p>
            <p className="mono-sm">
              <span className="muted">Mint:</span> {mint?.toBase58()}
            </p>
            {!!mint && (
              <p>
                <a
                  href={explorerToken(mint.toBase58())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Solscan
                </a>
              </p>
            )}
            <div className="chip-row" style={{ marginTop: 8 }}>
              <button onClick={goToVault} className="button">Go to Vault</button>
              <button onClick={() => navigate("/shop")} className="button ghost">Back to Shop</button>
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="card" role="log" aria-live="polite">
            <p className="mb-2" style={{ color: "#11f1a7", fontWeight: 700 }}>Log</p>
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
