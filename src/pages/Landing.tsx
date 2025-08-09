// src/pages/Landing.tsx
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  // avoid hydration flash / SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // redirect if already connected
  useEffect(() => {
    if (connected && publicKey) navigate("/dashboard", { replace: true });
  }, [connected, publicKey, navigate]);

  // returning user vault shortcut
  const userSymbol = useMemo(() => {
    const v = localStorage.getItem("vaultSymbol");
    return v ? v.toUpperCase() : null;
  }, []);
  const vaultPath = userSymbol ? `/vault/${encodeURIComponent(userSymbol)}` : "/dashboard";

  return (
    <main className="landing-gradient">
      {/* Social: pinned to top-center */}
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

      {/* Logo + actions */}
      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${publicKey ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {/* Hide wallet button until mounted to avoid SSR mismatch */}
        {mounted && <WalletMultiButton className="landing-wallet" />}

        {/* Optional: returning user quick link (shows alongside wallet) */}
        {mounted && userSymbol && (
          <Link className="landing-wallet" to={vaultPath} aria-label={`Open vault ${userSymbol}`}>
            Open Vault / {userSymbol}
          </Link>
        )}
      </div>
    </main>
  );
}
