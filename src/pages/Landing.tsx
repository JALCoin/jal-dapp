// src/pages/Landing.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";

export default function Landing() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [merging, setMerging] = useState(false);
  const timerRef = useRef<number | null>(null);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Auto-redirect to hub when connected (desktop + mobile)
  useEffect(() => {
    if (!connected || !publicKey) return;

    setMerging(true);
    const delay = reducedMotion ? 0 : 450;

    timerRef.current = window.setTimeout(() => {
      navigate("/hub", { replace: true });
    }, delay);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [connected, publicKey, navigate, reducedMotion]);

  // Reset merge state if disconnected
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
      <div className="landing-social" aria-hidden={merging}>
        <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
          <img src="/icons/X.png" alt="" />
        </a>
        <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <img src="/icons/Telegram.png" alt="" />
        </a>
        <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <img src="/icons/TikTok.png" alt="" />
        </a>
      </div>

      {merging && (
        <div className="landing-disconnect">
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        </div>
      )}

      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${connected ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {!connected && (
          <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />
        )}
      </div>
    </main>
  );
}
