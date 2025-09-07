// src/pages/CryptoGenerator.tsx
import type { FC, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { useNavigate, useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import TokenFinalizerModal from "../utils/TokenFinalizerModal";

/* ---------------------------------- */
const STEPS = [
  "Set Up Token",
  "Create Mint Account",
  "Create Token Account",
  "Mint Supply",
  "Attach Metadata",
  "Finish",
] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

const rpcFromEnv =
  (typeof window !== "undefined" && (window as any).__SOLANA_RPC_ENDPOINT__) ||
  import.meta.env.VITE_SOLANA_RPC ||
  clusterApiUrl("mainnet-beta");
/* ---------------------------------- */

type SetupState = {
  name: string;
  symbol: string;
  decimals: number;
  supplyUi: string;          // user-typed UI units
  destination: string;       // owner address (defaults to connected wallet)
  freeze: boolean;           // set freeze authority
  renounceAfterMint: boolean;// remove mint authority after minting
};

const DEFAULTS: SetupState = {
  name: "",
  symbol: "",
  decimals: 9,
  supplyUi: "1000000000",
  destination: "",
  freeze: false,
  renounceAfterMint: false,
};

const CryptoGenerator: FC = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const connection = useMemo(() => new Connection(rpcFromEnv, "confirmed"), []);
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<StepIndex>(0);
  const [setup, setSetup] = useState<SetupState>({ ...DEFAULTS });
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
    setStep(idx as StepIndex);
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
  const parseDest = () => {
    try {
      const dest = setup.destination?.trim() || publicKey?.toBase58() || "";
      return dest ? new PublicKey(dest) : null;
    } catch {
      return null;
    }
  };
  const supplyBig = () => {
    const ui = Number(setup.supplyUi.replaceAll(",", ""));
    if (!isFinite(ui) || ui < 0) return null;
    try {
      return BigInt(Math.floor(ui * 10 ** Math.max(0, setup.decimals)));
    } catch {
      return null;
    }
  };

  const [rentExemptMint, setRentExemptMint] = useState<number>(0);
  const [feeHint, setFeeHint] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const rent = await getMinimumBalanceForRentExemptMint(connection);
        setRentExemptMint(rent);
        const approxLamports = rent + 5 * 5000; // rough: 5 tx × 5000 lamports + rent
        setFeeHint(`~${(approxLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL (incl. mint rent)`);
      } catch {
        /* ignore */
      }
    })();
  }, [connection]);

  /* ---------- step runner ---------- */
  const runStep = useCallback(async () => {
    if (!publicKey || !sendTransaction) return;
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      switch (step) {
        // 1) Create mint
        case 1: {
          const decimals = Math.max(0, Math.min(9, setup.decimals | 0));
          const lamports = await getMinimumBalanceForRentExemptMint(connection);
          const mintAccount = Keypair.generate();
          setMint(mintAccount.publicKey);

          const createIx = SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mintAccount.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          });

          const initIx = createInitializeMintInstruction(
            mintAccount.publicKey,
            decimals,
            publicKey,
            setup.freeze ? publicKey : null
          );

          const tx = new Transaction().add(createIx, initIx);
          tx.partialSign(mintAccount);
          const sig = await sendTransaction(tx, connection, { signers: [mintAccount] });
          log(`Mint created: ${mintAccount.publicKey.toBase58()}`);
          log(`https://solscan.io/tx/${sig}`);
          break;
        }

        // 2) Create ATA
        case 2: {
          if (!mint) throw new Error("Mint not set");
          const owner = parseDest();
          if (!owner) throw new Error("Destination owner address invalid");
          const ataAddr = await getAssociatedTokenAddress(mint, owner);
          setAta(ataAddr);

          const exists = await connection.getAccountInfo(ataAddr);
          if (exists) {
            log(`Token account already exists: ${ataAddr.toBase58()}`);
            break;
          }

          const createAtaIx = createAssociatedTokenAccountInstruction(
            publicKey, // payer
            ataAddr,   // ata
            owner,     // owner
            mint
          );
          const tx = new Transaction().add(createAtaIx);
          const sig = await sendTransaction(tx, connection);
          log(`Token account created: ${ataAddr.toBase58()}`);
          log(`https://solscan.io/tx/${sig}`);
          break;
        }

        // 3) Mint supply (+ optional renounce)
        case 3: {
          if (!mint || !ata) throw new Error("Mint or ATA not set");

          const amt = supplyBig();
          if (amt == null) throw new Error("Supply invalid");

          const tx = new Transaction().add(
            createMintToInstruction(mint, ata, publicKey, amt)
          );

          if (setup.renounceAfterMint) {
            tx.add(
              createSetAuthorityInstruction(
                mint,
                publicKey,
                AuthorityType.MintTokens,
                null
              )
            );
          }

          const sig = await sendTransaction(tx, connection);
          log(`Supply minted: ${Number(setup.supplyUi).toLocaleString()} (decimals=${setup.decimals})`);
          if (setup.renounceAfterMint) log("Mint authority RENOUNCED");
          log(`https://solscan.io/tx/${sig}`);
          break;
        }

        // 4) Metadata via modal
        case 4: {
          setShowFinalizer(true);
          return;
        }

        // 5) Done
        case 5: {
          if (mint && ata) {
            localStorage.setItem("mint", mint.toBase58());
            localStorage.setItem("ata", ata.toBase58());
            log("Token generation complete.");
          }
          break;
        }
      }

      setStep((s) => Math.min((s + 1) as StepIndex, 5 as StepIndex));
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      log(`Error: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [step, mint, ata, setup, publicKey, sendTransaction, connection, loading]);

  /* ---------- local actions ---------- */
  const reset = () => {
    setStep(0);
    setSetup({ ...DEFAULTS, destination: publicKey?.toBase58() ?? "" });
    setMint(null);
    setAta(null);
    setLogs([]);
    setError(null);
    setShowFinalizer(false);
  };

  useEffect(() => {
    if (publicKey && !setup.destination) {
      setSetup((s) => ({ ...s, destination: publicKey.toBase58() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey?.toBase58()]);

  const goToVault = () => navigate("/?panel=vault");

  const handleMetadataSuccess = (mintStr: string) => {
    log(`Metadata attached to ${mintStr}`);
    setShowFinalizer(false);
    setStep((s) => Math.min((s + 1) as StepIndex, 5 as StepIndex));
  };

  /* ---------- Setup form ---------- */
  const onSetupSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!connected) {
      setError("Connect a wallet to continue.");
      return;
    }
    if (!setup.symbol.trim()) {
      setError("Please enter a symbol.");
      return;
    }
    if (!supplyBig()) {
      setError("Initial supply is invalid.");
      return;
    }
    setError(null);
    setStep(1);
  };

  const estText =
    feeHint &&
    `Est. SOL needed: ${feeHint}${rentExemptMint ? ` • Mint rent: ${(rentExemptMint / LAMPORTS_PER_SOL).toFixed(4)} SOL` : ""}`;

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

        {/* Step content */}
        {step === 0 && (
          <form className="card space-y-3" onSubmit={onSetupSubmit}>
            <div>
              <label className="block text-sm opacity-90">Token Name (optional)</label>
              <input
                className="shop-search"
                placeholder="e.g., JAL Points"
                value={setup.name}
                onChange={(e) => setSetup((s) => ({ ...s, name: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="block text-sm opacity-90">Symbol</label>
              <input
                className="shop-search"
                placeholder="e.g., JALP"
                value={setup.symbol}
                onChange={(e) => setSetup((s) => ({ ...s, symbol: e.target.value.toUpperCase().slice(0, 10) }))}
                style={{ width: "100%" }}
                required
              />
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="block text-sm opacity-90">Decimals</label>
                <input
                  type="number"
                  min={0}
                  max={9}
                  className="shop-search"
                  value={setup.decimals}
                  onChange={(e) => setSetup((s) => ({ ...s, decimals: Math.max(0, Math.min(9, Number(e.target.value) | 0)) }))}
                />
              </div>
              <div>
                <label className="block text-sm opacity-90">Initial Supply (UI)</label>
                <input
                  className="shop-search"
                  placeholder="1000000000"
                  value={setup.supplyUi}
                  onChange={(e) => setSetup((s) => ({ ...s, supplyUi: e.target.value.replace(/[^\d.,]/g, "") }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm opacity-90">Mint To (owner wallet)</label>
              <input
                className="shop-search"
                placeholder={publicKey?.toBase58() ?? "Owner wallet address"}
                value={setup.destination}
                onChange={(e) => setSetup((s) => ({ ...s, destination: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>

            <div className="chip-row">
              <label className="chip" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={setup.freeze}
                  onChange={(e) => setSetup((s) => ({ ...s, freeze: e.target.checked }))}
                  style={{ marginRight: 8 }}
                />
                Set freeze authority to my wallet
              </label>
              <label className="chip" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={setup.renounceAfterMint}
                  onChange={(e) => setSetup((s) => ({ ...s, renounceAfterMint: e.target.checked }))}
                  style={{ marginRight: 8 }}
                />
                Renounce mint authority after mint
              </label>
            </div>

            {estText && <p className="muted text-sm">{estText}</p>}

            <div className="flex gap-10">
              <button type="submit" className="button gold" disabled={!connected}>
                Start Generation
              </button>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setSetup({ ...DEFAULTS, destination: publicKey?.toBase58() ?? "" });
                }}
              >
                Reset form
              </button>
            </div>
          </form>
        )}

        {(step as number) > 0 && (step as number) < STEPS.length && (
          <button onClick={runStep} disabled={loading || !publicKey} className="button" aria-busy={loading}>
            {loading ? "Processing…" : "Next Step"}
          </button>
        )}

        {step === 5 && (
          <div className="space-y-3 text-sm" style={{ color: "#11f1a7" }}>
            <p>
              <strong>Mint:</strong> {mint?.toBase58()}
            </p>
            {!!mint && (
              <p>
                <a
                  href={`https://solscan.io/token/${mint.toBase58()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Solscan
                </a>
              </p>
            )}
            <div className="chip-row">
              <a className="chip" href={`https://raydium.io/`} target="_blank" rel="noreferrer">
                Open Raydium
              </a>
              <a className="chip" href={`https://jup.ag/`} target="_blank" rel="noreferrer">
                Open Jupiter
              </a>
            </div>
            <button onClick={goToVault} className="button">
              Go to Vault
            </button>
          </div>
        )}

        {logs.length > 0 && (
          <div className="card log-box" role="log" aria-live="polite">
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
                name={setup.name}
                symbol={setup.symbol}
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
