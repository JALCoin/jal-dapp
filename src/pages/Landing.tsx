// src/pages/Landing.tsx
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [merging, setMerging] = useState(false);

  // On connect: run merge animation, then go to /hub
  useEffect(() => {
    if (connected && publicKey && !merging) {
      setMerging(true);
      const t = setTimeout(() => {
        navigate("/hub", { replace: true });
      }, 1000); // match your CSS transition duration
      return () => clearTimeout(t);
    }
  }, [connected, publicKey, merging, navigate]);

  // Reset visual state if disconnected while still on landing
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
    }
  }, [connected, publicKey]);

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} style={{ position: "relative" }}>
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

      {/* Show Disconnect button during merge so users can cancel */}
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

        <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />
      </div>
    </main>
  );
}
