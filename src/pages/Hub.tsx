// src/pages/Hub.tsx
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Hub() {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();

  // Guard: if wallet gets disconnected, bounce back to landing
  useEffect(() => {
    if (!connected) navigate("/", { replace: true });
  }, [connected, navigate]);

  const shortPk = useMemo(() => {
    if (!publicKey) return "";
    const s = publicKey.toBase58();
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }, [publicKey]);

  return (
    <main className="hub" role="main">
      <div className="hub-inner" style={{ animation: "fadeIn .4s ease-out" }}>
        <h1 className="hub-title">Welcome to the JAL Hub</h1>

        {shortPk && (
          <p
            className="text-center"
            style={{
              marginTop: "-0.5rem",
              marginBottom: "1.25rem",
              color: "var(--jal-muted)",
              fontSize: "0.9rem",
            }}
          >
            Connected: <span style={{ color: "#fff" }}>{shortPk}</span>
          </p>
        )}

        <nav className="hub-stack" aria-label="Main actions">
          {/* START — swap JAL⇄SOL & add liquidity (Raydium flow can live here later) */}
          <Link to="/start" className="hub-btn">
            START
            <span className="sub">
              Swap JAL ⇄ SOL &amp; provide liquidity on Raydium
            </span>
          </Link>

          {/* JAL/SOL Utility — docs/tools/links */}
          <Link to="/utility" className="hub-btn">
            JAL / SOL (Utility)
            <span className="sub">Tools, docs, and live utilities</span>
          </Link>

          {/* Terms of Use */}
          <Link to="/terms" className="hub-btn">
            Terms of Use
            <span className="sub">Read before using the dapp</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}
