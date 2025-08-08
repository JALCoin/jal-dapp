// src/pages/Landing.tsx
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  // Redirect when connected
  useEffect(() => {
    if (publicKey) {
      navigate("/dashboard", { replace: true });
    }
  }, [publicKey, navigate]);

  return (
    <main className="landing">
      {/* Shared animated machine background */}
      <div className="machine-bg" aria-hidden />

      <div className="landing-inner">
        {/* Reusable glowing logo circle */}
        <div className={`logo-circle ${publicKey ? "wallet-connected" : ""}`}>
          <img
            src="/JALSOL1.gif"
            alt="JAL/SOL"
            style={{ width: "70%", height: "auto" }}
          />
        </div>

        <WalletMultiButton className="landing-wallet" />
      </div>
    </main>
  );
}
