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

  // 1) Robust redirect: go to /hub immediately when connected.
  useEffect(() => {
    if (!connected || !publicKey) return;

    setMerging(true);

    timerRef.current = window.setTimeout(() => {
      navigate("/hub", { replace: true });
    }, 150); 

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [connected, publicKey, navigate]);

  // Reset merge if user disconnects
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
        <div className={`landing-logo-wrapper ${merging ? "to-top" : ""} ${connected ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {!connected && <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />}

        {connected && (
          <button
            type="button"
            onClick={() => navigate("/hub", { replace: true })}
            style={{ marginTop: 16, background: "transparent", color: "#ffd700", border: "none", cursor: "pointer" }}
          >
            Continue to Hub →
          </button>
        )}
      </div>
    </main>
  );
}
