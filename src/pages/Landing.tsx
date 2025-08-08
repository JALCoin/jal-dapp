// src/pages/Landing.tsx
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  // When connected, send them in
  useEffect(() => {
    if (publicKey) {
      // change to `/vault/XYZ` if you want
      navigate("/dashboard", { replace: true });
    }
  }, [publicKey, navigate]);

  return (
    <main className="landing">
      <div className="landing-bg" aria-hidden />
      <div className="landing-inner">
        <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        <WalletMultiButton className="landing-wallet" />
      </div>
    </main>
  );
}
