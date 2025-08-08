// src/pages/Vault.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Link } from "react-router-dom";

export default function Vault() {
  const { publicKey } = useWallet();
  const [sol, setSol] = useState<number | null>(null);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedSymbol = (localStorage.getItem("vaultSymbol") || "JAL").toUpperCase();

  const connection = useMemo(
    () => new Connection("https://api.mainnet-beta.solana.com", "confirmed"),
    []
  );

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const [lamports, parsedAccounts] = await Promise.all([
        connection.getBalance(publicKey as PublicKey),
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
      ]);

      setSol(lamports / LAMPORTS_PER_SOL);

      const owned = parsedAccounts.value.filter(({ account }) => {
        const ui = account.data.parsed.info.tokenAmount.uiAmount;
        return ui && ui > 0;
      });
      setTokenCount(owned.length);
    } catch (e: any) {
      console.error("Vault load error:", e);
      setError("Couldn’t fetch balances. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    if (publicKey) load();
    else {
      setSol(null);
      setTokenCount(null);
      setLoading(false);
    }
  }, [publicKey, load]);

  const refresh = async () => {
    if (!publicKey) return;
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <main className="vault-screen vault-unlock">
      {/* animated background */}
      <div className="machine-bg" aria-hidden />

      <h1 className="vault-title">VAULT</h1>

      <div className={`logo-circle ${publicKey ? "wallet-connected" : ""}`}>
        <div className="vault-logo-inner" style={{ textAlign: "center" }}>
          Logo: Updated after
          <br />
          currency creation.
        </div>
      </div>

      <h2 className="vault-slogan">Plenty is built. I’m created.</h2>

      {!publicKey ? (
        <p className="vault-subtext">Connect your wallet to view balances and create your currency.</p>
      ) : loading ? (
        <p className="vault-subtext">Loading your balances…</p>
      ) : (
        <>
          {error && <p className="vault-subtext" style={{ color: "#ff9c9c" }}>{error}</p>}

          <p className="vault-subtext" style={{ marginBottom: "1rem" }}>
            Address:
            <br />
            <span style={{ fontSize: "0.8rem" }}>{publicKey.toBase58()}</span>
          </p>

          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.25rem", textAlign: "center" }}>
            <div className="vault-subtext">◎ SOL Balance: <strong>{sol?.toFixed(4) ?? "—"}</strong></div>
            <div className="vault-subtext">🪙 Tokens in Vault: <strong>{tokenCount ?? 0}</strong></div>
            <button className="vault-button" onClick={refresh} disabled={refreshing}>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </>
      )}

      <div className="vault-cta-container" style={{ display: "grid", gap: "0.75rem" }}>
        <Link to={`/vault/${savedSymbol}`} className="vault-button">
          {`Go to Vault / ${savedSymbol}`}
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
