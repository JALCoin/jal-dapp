// src/pages/Home.tsx
import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const [userSymbol, setUserSymbol] = useState<string | null>(null);
  const location = useLocation();
  const { connected } = useWallet();

  // We render Home underneath Landing during the slide. While location is "/",
  // the global header is hidden—so show a temporary topbar here.
  const showInlineTopbar = location.pathname === "/";

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  const vaultPath = useMemo(
    () => (userSymbol ? `/vault/${encodeURIComponent(userSymbol)}` : "/dashboard"),
    [userSymbol]
  );

  return (
    <main className="jal-page fade-in">
      {/* === Inline topbar visible only during the reveal on "/" === */}
      {showInlineTopbar && (
        <div className="jal-topbar">
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="jal-topbar-logo" />
          {connected && <WalletDisconnectButton className="wallet-disconnect-btn" />}
        </div>
      )}

      {/* === Header (logo pulse) for /home and also looks fine during reveal === */}
      <div className="jal-header">
        <img src="/JALSOL1.gif" alt="JAL/SOL" className="jal-header-logo" />
      </div>

      <h1 className="jal-title">Choose Your Direction</h1>

      <div className="jal-buttons">
        <Link to="/crypto-generator" className="jal-button gold">
          CREATE YOUR CURRENCY
        </Link>

        <Link to={vaultPath} className="jal-button secondary">
          {userSymbol ? `OPEN VAULT / ${userSymbol}` : "OPEN VAULT"}
        </Link>

        <Link to="/learn" className="jal-button secondary">
          LEARN / SOL
        </Link>

        <Link to="/about" className="jal-button secondary">
          ABOUT JAL
        </Link>
      </div>

      <footer className="site-footer mt-3">
        © 2025 JAL/SOL • Computed by SOL • 358jal@gmail.com
      </footer>
    </main>
  );
}
