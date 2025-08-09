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

  // When connected, reveal Home underneath and slide Landing away.
  useEffect(() => {
    if (connected && publicKey && !leaving) {
      setShowHome(true);      // show Home behind
      setLeaving(true);       // start slide-up animation
      const t = setTimeout(() => {
        navigate("/home", { replace: true }); // then switch to /home
      }, 600); // match CSS keyframe duration
      return () => clearTimeout(t);
    }
  }, [connected, publicKey, leaving, navigate]);

  // IMPORTANT: if user disconnects on "/", reset overlay & animation
  useEffect(() => {
    if (!connected || !publicKey) {
      setShowHome(false);  // hide background Home
      setLeaving(false);   // cancel slide
    }
  }, [connected, publicKey]);

  return (
    <div style={{ position: "relative", minHeight: "100svh" }}>
      {/* Home is rendered behind Landing for overlap reveal */}
      {showHome && <Home />}

      <main
        className={`landing-gradient ${leaving ? "landing-exit" : ""}`}
        style={{ position: "absolute", inset: 0, zIndex: 10 }}
      >
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
