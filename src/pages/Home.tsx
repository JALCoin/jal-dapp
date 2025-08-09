// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

type Action = {
  to: string;
  label: string;
  desc?: string;
  variant?: "primary" | "secondary";
  icon?: string; // path to /icons/*.svg|png or emoji as fallback
};

export default function Home() {
  const [userSymbol, setUserSymbol] = useState<string | null>(null);
  const { connected } = useWallet();
  const location = useLocation();
  const showInlineTopbar = location.pathname === "/"; // only during landing→home reveal

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  const vaultPath = useMemo(
    () => (userSymbol ? `/vault/${encodeURIComponent(userSymbol)}` : "/dashboard"),
    [userSymbol]
  );

  const actions: Action[] = [
    {
      to: "/crypto-generator",
      label: "Create Your Currency",
      desc: "Mint a new token on SOL with guided steps.",
      variant: "primary",
      icon: "/icons/bolt.png", // put any small 20–24px icon here (or use "⚡")
    },
    {
      to: vaultPath,
      label: userSymbol ? `Open Vault / ${userSymbol}` : "Open Vault",
      desc: "View balances, manage mints, and shortcuts.",
      variant: "secondary",
      icon: "/icons/vault.png",
    },
    {
      to: "/learn",
      label: "Learn / SOL",
      desc: "Short reads to go from zero to shipping.",
      variant: "secondary",
      icon: "/icons/book.png",
    },
    {
      to: "/about",
      label: "About JAL",
      desc: "Why this exists and where it’s going.",
      variant: "secondary",
      icon: "/icons/info.png",
    },
  ];

  return (
    <main className="jal-page fade-in">

      {/* Topbar only visible while still on "/" during reveal */}
      {showInlineTopbar && (
        <div className="jal-topbar">
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="jal-topbar-logo" />
          {connected && <WalletDisconnectButton className="wallet-disconnect-btn" />}
        </div>
      )}

      {/* Center logo */}
      <div className="jal-header">
        <img src="/JALSOL1.gif" alt="JAL/SOL" className="jal-header-logo" />
      </div>
      <div className="jal-divider" aria-hidden="true" />

      {/* Status hint */}
      <p className="jal-status" role="status">
        {connected ? "Wallet connected" : "No wallet connected — you can still browse."}
      </p>

      <h1 className="jal-title">Choose Your Direction</h1>

      {/* Directive buttons */}
      <nav className="jal-buttons" aria-label="Primary actions">
        {actions.map((a, i) => (
          <Link
            key={a.label + i}
            to={a.to}
            className={`jal-button ${a.variant === "primary" ? "gold" : "secondary"}`}
            aria-label={a.label}
          >
            <span className="jal-btn-inner">
              <span className="jal-btn-icon" aria-hidden="true">
                {/* If you don’t have icons yet, you can put an emoji like "⚡" directly */}
                {a.icon?.startsWith("/") ? (
                  <img src={a.icon} alt="" />
                ) : (
                  <span>{a.icon || "•"}</span>
                )}
              </span>
              <span className="jal-btn-text">
                <span className="label">{a.label.toUpperCase()}</span>
                {a.desc && <span className="desc">{a.desc}</span>}
              </span>
            </span>
          </Link>
        ))}
      </nav>

      <footer className="site-footer mt-3">
        © 2025 JAL/SOL • Computed by SOL • 358jal@gmail.com
      </footer>
    </main>
  );
}
