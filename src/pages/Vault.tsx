// src/pages/Vault.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { makeConnection } from "../config/rpc";
import { verifyTokenMetadataAttached } from "../utils/verifyTokenMetadataAttached";
import PositionsList from "../components/PositionsList";

type HeaderMint = {
  mint: string;
  name?: string;
  symbol?: string;
  image?: string;
  metadataUri?: string;
  balance?: number;
};

const toHttp = (uri?: string) =>
  uri?.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`
    : uri ?? "";

export default function Vault() {
  const { publicKey } = useWallet();

  // single RPC (respects env/Helius headers via makeConnection)
  const connection = useMemo(() => makeConnection("confirmed"), []);

  // live tiles
  const [sol, setSol] = useState<number | null>(null);
  const [tokenCount, setTokenCount] = useState<number | null>(null);

  // header: last created currency
  const [header, setHeader] = useState<HeaderMint | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fallback symbol for CTA link
  const savedSymbol = (localStorage.getItem("vaultSymbol") || "JAL").toUpperCase();

  // ---------- loaders ----------
  const loadWalletTiles = useCallback(async () => {
    if (!publicKey) return;

    const [lamports, parsed] = await Promise.all([
      connection.getBalance(publicKey),
      connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }, "confirmed"),
    ]);

    setSol(lamports / LAMPORTS_PER_SOL);

    const owned = parsed.value.filter(({ account }) => {
      const ui = account.data.parsed.info.tokenAmount?.uiAmount;
      return typeof ui === "number" && ui > 0;
    });
    setTokenCount(owned.length);
  }, [connection, publicKey]);

  const loadHeaderFromLocalStorage = useCallback(async () => {
    const mintStr = localStorage.getItem("mint"); // set by generator when done
    if (!mintStr) {
      setHeader(null);
      return;
    }
    const mintPk = new PublicKey(mintStr);

    // try chain metadata first
    let name: string | undefined;
    let symbol: string | undefined;
    let metadataUri: string | undefined;
    let image: string | undefined;

    try {
      const meta = await verifyTokenMetadataAttached(connection, mintPk);
      name = meta.name || name;
      symbol = meta.symbol || symbol;
      metadataUri = meta.uri || metadataUri;

      // fetch JSON if we have a URI to extract image and possibly override name/symbol
      if (meta.uri) {
        try {
          const res = await fetch(toHttp(meta.uri), { cache: "no-store" });
          const j = await res.json();
          image = toHttp(j.image || j.logo || j.icon) || image;
          name = name || j.name;
          symbol = symbol || j.symbol;
        } catch {
          /* ignore JSON fetch issues */
        }
      }
    } catch {
      /* missing metadata is fine; fall back below */
    }

    // fallbacks from localStorage (saved by TokenFinalizerModal)
    image = image || toHttp(localStorage.getItem("mintImage") || undefined);
    metadataUri = metadataUri || localStorage.getItem("metadataUri") || undefined;

    // user's balance of this mint (if present)
    let balance = 0;
    if (publicKey) {
      try {
        const resp = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID },
          "confirmed"
        );
        const acct = resp.value.find((v) => v.account.data.parsed.info.mint === mintStr);
        if (acct) {
          const amt = acct.account.data.parsed.info.tokenAmount?.uiAmount;
          if (typeof amt === "number") balance = amt;
        }
      } catch {
        /* non-fatal */
      }
    }

    setHeader({
      mint: mintStr,
      name: name || "Your Currency",
      symbol: (symbol || savedSymbol || "JAL").toUpperCase(),
      image,
      metadataUri,
      balance,
    });
  }, [connection, publicKey, savedSymbol]);

  // initial + wallet-change loads
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (publicKey) {
          await Promise.all([loadWalletTiles(), loadHeaderFromLocalStorage()]);
        } else {
          setSol(null);
          setTokenCount(null);
          setHeader(null);
        }
      } catch (e) {
        console.error("Vault load error:", e);
        setError("Couldn’t fetch balances. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [publicKey, loadWalletTiles, loadHeaderFromLocalStorage]);

  // react to localStorage changes from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mint" || e.key === "metadataUri" || e.key === "mintImage" || e.key === "vaultSymbol") {
        loadHeaderFromLocalStorage();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadHeaderFromLocalStorage]);

  const refresh = async () => {
    if (!publicKey) return;
    setRefreshing(true);
    try {
      await Promise.all([loadWalletTiles(), loadHeaderFromLocalStorage()]);
    } finally {
      setRefreshing(false);
    }
  };

  // ---------- UI ----------
  return (
    <main className="vault-screen vault-unlock" role="main">
      {/* animated background */}
      <div className="machine-bg" aria-hidden />

      <h1 className="vault-title">VAULT</h1>

      <div className={`logo-circle ${publicKey ? "wallet-connected" : ""}`}>
        {header?.image ? (
          <img
            alt={header.name || "Currency"}
            src={header.image}
            style={{ width: "70%", height: "70%", borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div className="vault-logo-inner" style={{ textAlign: "center" }}>
            Logo: Updated after
            <br />
            currency creation.
          </div>
        )}
      </div>

      <h2 className="vault-slogan">Plenty is built. I’m created.</h2>

      {!publicKey ? (
        <p className="vault-subtext">Connect your wallet to view balances and create your currency.</p>
      ) : loading ? (
        <p className="vault-subtext">Loading your balances…</p>
      ) : (
        <>
          {error && (
            <p className="vault-subtext" style={{ color: "#ff9c9c" }}>
              {error}
            </p>
          )}

          {/* Header card: newest currency */}
          {header && (
            <div className="card" style={{ width: "min(100% - 2rem, 860px)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    overflow: "hidden",
                    background: "rgba(255,255,255,.04)",
                  }}
                >
                  {header.image ? (
                    <img src={header.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : null}
                </div>

                <div>
                  <h3 style={{ margin: 0, fontWeight: 700 }}>
                    {header.name} <span className="muted">({header.symbol})</span>
                  </h3>
                  <div className="chip-row" style={{ marginTop: 8 }}>
                    <span className="chip">
                      Mint: <span className="mono-sm">{header.mint.slice(0, 4)}…{header.mint.slice(-4)}</span>
                    </span>
                    {typeof header.balance === "number" && (
                      <span className="chip">Your Balance: <strong>{header.balance}</strong></span>
                    )}
                    <a
                      className="chip"
                      href={`https://solscan.io/token/${header.mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Solscan ↗
                    </a>
                    {header.metadataUri && (
                      <a className="chip" href={toHttp(header.metadataUri)} target="_blank" rel="noopener noreferrer">
                        Metadata ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wallet summary tiles */}
          <div
            style={{
              display: "grid",
              gap: "0.5rem",
              margin: "1rem 0",
              textAlign: "center",
              width: "min(100% - 2rem, 860px)",
            }}
          >
            <div className="balance-row">
              <div className="balance-card">
                <div className="balance-amount">
                  {sol?.toFixed(4) ?? "—"} <small>◎ SOL</small>
                </div>
                <div className="balance-label">Wallet balance</div>
              </div>
              <div className="balance-card">
                <div className="balance-amount">
                  {tokenCount ?? 0} <small>tokens</small>
                </div>
                <div className="balance-label">SPL positions held</div>
              </div>
            </div>

            <button className="vault-button" onClick={refresh} disabled={refreshing}>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {/* Address */}
          <p className="vault-subtext" style={{ marginBottom: "1rem", textAlign: "center" }}>
            Address:
            <br />
            <span className="mono-sm">{publicKey.toBase58()}</span>
          </p>

          {/* Positions list (live), highlights last-created mint if present */}
          <PositionsList owner={publicKey} connection={connection} highlightMint={header?.mint} />
        </>
      )}

      {/* CTAs */}
      <div className="vault-cta-container" style={{ display: "grid", gap: "0.75rem" }}>
        <Link to={`/vault/${header?.symbol || savedSymbol}`} className="vault-button">
          {`Go to Vault / ${(header?.symbol || savedSymbol).toUpperCase()}`}
        </Link>
        <Link to="/crypto-generator" className="vault-button">
          CREATE YOUR CURRENCY
        </Link>
      </div>

      <footer className="site-footer">
        © 2025 JAL/SOL • Computed by SOL • <a href="mailto:358jal@gmail.com">358jal@gmail.com</a>
      </footer>
    </main>
  );
}
