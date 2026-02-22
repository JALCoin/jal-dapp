// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

import LogoPulse from "../components/LogoPulse";

type Action = {
  to: string;
  label: string;
  desc?: string;
  variant?: "primary" | "secondary";
  icon?: string; // /icons/*.png|svg or emoji fallback
};

type EngineModule = {
  key: "token" | "raydium" | "engine" | "inventory";
  kicker: string;
  title: string;
  sub: string;
  to?: string; // optional route
};

export default function Home() {
  const [userSymbol, setUserSymbol] = useState<string | null>(null);
  const { connected } = useWallet();
  const location = useLocation();

  // Only show the inline topbar during "/" reveal moments (if you still route Home there).
  const showInlineTopbar = location.pathname === "/";

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
      icon: "/icons/bolt.png",
    },
    {
      to: vaultPath,
      label: userSymbol ? `Open Vault / ${userSymbol}` : "Open Vault",
      desc: "View balances, manage mints, and shortcuts.",
      variant: "secondary",
      icon: "/icons/vault.png",
    },
    {
      to: "/shop",
      label: "Shop",
      desc: "Physical + digital goods built by JAL.",
      variant: "secondary",
      icon: "/icons/shop.png",
    },
    {
      to: "/about",
      label: "About JAL",
      desc: "Founder, system intent, and direction.",
      variant: "secondary",
      icon: "/icons/info.png",
    },
  ];

  const modules: EngineModule[] = [
    {
      key: "token",
      kicker: "JALSOL",
      title: "Solana token generation",
      sub: "Create currency + metadata workflow.",
      to: "/crypto-generator",
    },
    {
      key: "raydium",
      kicker: "RAYDIUM",
      title: "Create liquidity pool with $JAL",
      sub: "JAL/SOL pool overview + verification links.",
      to: "/raydium",
    },
    {
      key: "engine",
      kicker: "$JAL~Engine",
      title: "Read live market (CoinSpot API)",
      sub: "Sign in (Full / Read-only) • Jeroid deployment • logs.",
      to: "/engine",
    },
    {
      key: "inventory",
      kicker: "INVENTORY",
      title: "Software Inventory",
      sub: "How-to’s & guides • replicate the system.",
      to: "/inventory",
    },
  ];

  return (
    <main className="jal-page fade-in">
      {/* Optional topbar during reveal */}
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

      {/* Primary action buttons */}
      <nav className="jal-buttons" aria-label="Primary actions">
        {actions.map((a, i) => (
          <Link
            key={`${a.label}-${i}`}
            to={a.to}
            className={`jal-button ${a.variant === "primary" ? "gold" : "secondary"}`}
            aria-label={a.label}
          >
            <span className="jal-btn-inner">
              <span className="jal-btn-icon" aria-hidden="true">
                {a.icon?.startsWith("/") ? <img src={a.icon} alt="" /> : <span>{a.icon || "•"}</span>}
              </span>

              <span className="jal-btn-text">
                <span className="label">{a.label.toUpperCase()}</span>
                {a.desc && <span className="desc">{a.desc}</span>}
              </span>
            </span>
          </Link>
        ))}
      </nav>

      {/* Embedded Engine Stage window */}
      <section className="engine-stage card" aria-label="JAL System Console">
        <div className="engine-stage__head">
          <div>
            <h2 className="engine-stage__title">System Console</h2>
            <span className="engine-stage__sub">Select a module</span>
          </div>
        </div>

        <div className="engine-stage__frame">
          {/* Low-opacity pulsing logo (same vibe as ENTER) */}
          <LogoPulse className="engine-stage__bg" opacity={0.10} />

          <div className="engine-stage__grid" role="list">
            {modules.map((m) => (
              <Link
                key={m.key}
                to={m.to ?? "#"}
                className="engine-tile"
                role="listitem"
                aria-label={m.title}
              >
                <div className="engine-tile__kicker">{m.kicker}</div>
                <div className="engine-tile__title">{m.title}</div>
                <div className="engine-tile__sub">{m.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}