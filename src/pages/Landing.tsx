import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useNavigate } from "react-router-dom";
import Home from "./Home";

export default function Landing() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [showHome, setShowHome] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (connected && publicKey && !leaving) {
      // 1) Immediately show Home under Landing
      setShowHome(true);
      // 2) Start slide-up animation
      setLeaving(true);
      // 3) After animation, route to /home so the site header appears
      const t = setTimeout(() => {
        navigate("/home", { replace: true });
      }, 600); // match CSS duration
      return () => clearTimeout(t);
    }
  }, [connected, publicKey, leaving, navigate]);

  return (
    <div style={{ position: "relative", minHeight: "100svh" }}>
      {/* Home is rendered behind Landing for overlap reveal */}
      {showHome && <Home />}

      <main
        className={`landing-gradient ${leaving ? "landing-exit" : ""}`}
        style={{ position: "absolute", inset: 0, zIndex: 10 }}
      >
        {/* Social (optional: add back your icons if you want) */}

        <div className="landing-inner">
          <div className={`landing-logo-wrapper ${connected ? "wallet-connected" : ""}`}>
            <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
          </div>
          <WalletMultiButton className="landing-wallet" />
        </div>
      </main>
    </div>
  );
}
