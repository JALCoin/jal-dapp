// src/pages/Landing.tsx
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [merging, setMerging] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Respect reduced-motion: skip animation and go straight to hub
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!connected || !publicKey || merging) return;

    if (prefersReducedMotion) {
      navigate("/hub", { replace: true });
      return;
    }

    setMerging(true);
    // match CSS timing (index.css: logoSlideToTop .8s + a little buffer)
    timerRef.current = window.setTimeout(() => navigate("/hub", { replace: true }), 1000);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [connected, publicKey, merging, navigate, prefersReducedMotion]);

  // Reset state if user disconnects while still on landing
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  return (
    <main
      className={`landing-gradient ${merging ? "landing-merge" : ""}`}
      style={{ position: "relative" }}
      aria-live="polite"
    >
      {/* Center-top social icons */}
      <div className="landing-social" aria-hidden={merging}>
        <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
          <img src="/icons/X.png" alt="X" />
        </a>
        <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <img src="/icons/Telegram.png" alt="Telegram" />
        </a>
        <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <img src="/icons/TikTok.png" alt="TikTok" />
        </a>
      </div>

      {/* Show Disconnect during merge so users can cancel */}
      {merging && (
        <div className="landing-disconnect">
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        </div>
      )}

      {/* Logo + wallet button */}
      <div className="landing-inner">
        <div
          className={`landing-logo-wrapper ${merging ? "to-top" : ""} ${
            connected ? "wallet-connected" : ""
          }`}
        >
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {/* Hide the connect button once we’re connected/merging */}
        {!connected && <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />}

        {/* SR-only connection hint */}
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {connected ? "Wallet connected. Preparing hub…" : "Wallet not connected."}
        </span>
      </div>
    </main>
  );
}
