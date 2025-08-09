// src/pages/Hub.tsx
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Hub() {
  const { connected } = useWallet();
  const navigate = useNavigate();

  // Guard: if wallet gets disconnected, bounce back to landing
  useEffect(() => {
    if (!connected) navigate("/", { replace: true });
  }, [connected, navigate]);

  return (
    <main className="hub">
      <div className="hub-inner">
        <h1 className="hub-title">Welcome to the JAL Hub</h1>

        <nav className="hub-stack" aria-label="Main actions">
          <Link to="/start" className="hub-btn">
            START
            <span className="sub">Swap JAL ⇄ SOL & provide liquidity on Raydium</span>
          </Link>

          <Link to="/utility" className="hub-btn">
            JAL / SOL (Utility)
            <span className="sub">Tools, docs, and live utilities</span>
          </Link>

          <Link to="/terms" className="hub-btn">
            Terms of Use
            <span className="sub">Read before using the dapp</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}
