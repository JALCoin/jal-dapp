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
      <div className="landing-inner">
        <img
          src="/JALSOL1.gif"
          alt="JAL/SOL"
          className="landing-logo"
        />
        <WalletMultiButton className="landing-wallet" />
      </div>
    </main>
  );
}
