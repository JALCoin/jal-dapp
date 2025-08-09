// src/pages/Landing.tsx
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => setMounted(true), []);

  // Animate out, then go to /home
  useEffect(() => {
    if (connected && publicKey && !leaving) {
      setLeaving(true);
      const t = setTimeout(() => navigate("/home", { replace: true }), 600); // match CSS duration
      return () => clearTimeout(t);
    }
  }, [connected, publicKey, leaving, navigate]);

  const userSymbol = useMemo(() => {
    const v = localStorage.getItem("vaultSymbol");
    return v ? v.toUpperCase() : null;
  }, []);
  const vaultPath = userSymbol ? `/vault/${encodeURIComponent(userSymbol)}` : "/dashboard";

  return (
    <main className={`landing-gradient ${leaving ? "landing-exit" : ""}`}>
      <div className="landing-social" aria-label="Social links">
        <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
          <img src="/icons/X.png" alt="" />
        </a>
        <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <img src="/icons/Telegram.png" alt="" />
        </a>
        <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <img src="/icons/TikTok.png" alt="" />
        </a>
      </div>

      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${publicKey ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {mounted && <WalletMultiButton className="landing-wallet" />}

        {mounted && userSymbol && !connected && (
          <Link className="landing-wallet" to={vaultPath}>
            Open Vault / {userSymbol}
          </Link>
        )}
      </div>
    </main>
  );
}
