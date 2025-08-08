// src/pages/Landing.tsx
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (publicKey) {
      navigate("/dashboard", { replace: true });
    }
  }, [publicKey, navigate]);

  return (
    <main className="landing-gradient">
      {/* Social buttons at center-top */}
      <div className="landing-social">
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

      {/* Logo with glow and wallet connect */}
      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${publicKey ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>
        <WalletMultiButton className="landing-wallet" />
      </div>
    </main>
  );
}
