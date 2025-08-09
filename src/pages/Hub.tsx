// src/pages/Hub.tsx
import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import type { CSSProperties } from "react";

export default function Hub() {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();

  // If wallet disconnects, bounce back to landing
  useEffect(() => {
    if (!connected) navigate("/", { replace: true });
  }, [connected, navigate]);

  // Scroll to top on mount (helps after landing animation)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Keyboard shortcuts for power users
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!connected) return;
      if (e.key === "1") navigate("/start");
      if (e.key === "2") navigate("/utility");
      if (e.key === "3") navigate("/terms");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [connected, navigate]);

  const shortPk = useMemo(() => {
    if (!publicKey) return "";
    const s = publicKey.toBase58();
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }, [publicKey]);

  return (
    <main className="hub" role="main" style={{ position: "relative" }}>
      {/* Top-right Disconnect */}
      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
        <WalletDisconnectButton className="hub-disconnect-btn" />
      </div>

      <div className="hub-inner" style={{ animation: "fadeIn .4s ease-out" } as CSSProperties}>
        <h1 className="hub-title">Welcome to the JAL Hub</h1>

        {shortPk && (
          <p className="hub-connection" aria-live="polite">
            <span>Connected</span> <span className="pill">{shortPk}</span>
          </p>
        )}

        <nav className="hub-stack" aria-label="Main actions">
          <Link
            to="/start"
            className="hub-btn"
            aria-label="Start: swap JAL and SOL and provide liquidity on Raydium"
            style={{ animation: "fadeIn .35s ease-out", animationDelay: "40ms" } as CSSProperties}
          >
            START
            <span className="sub">Swap JAL ⇄ SOL &amp; provide liquidity on Raydium</span>
          </Link>

          <Link
            to="/utility"
            className="hub-btn"
            aria-label="JAL / SOL Utility"
            style={{ animation: "fadeIn .35s ease-out", animationDelay: "90ms" } as CSSProperties}
          >
            JAL / SOL (Utility)
            <span className="sub">Tools, docs, and live utilities</span>
          </Link>

          <Link
            to="/terms"
            className="hub-btn"
            aria-label="Terms of Use"
            style={{ animation: "fadeIn .35s ease-out", animationDelay: "140ms" } as CSSProperties}
          >
            Terms of Use
            <span className="sub">Read before using the dapp</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}
