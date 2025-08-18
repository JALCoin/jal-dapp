// src/pages/Landing.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

type LandingProps = {
  /** optional deep link: open a specific panel on load (local state only) */
  initialPanel?: "none" | "shop" | "jal" | "vault";
};
type TileKey = Exclude<Required<LandingProps>["initialPanel"], "none">;

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected } = useWallet();

  const [merging, setMerging] = useState(false);
  const [activePanel, setActivePanel] = useState<LandingProps["initialPanel"]>(initialPanel);
  const timerRef = useRef<number | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Preload hub GIFs (STORE removed)
  useEffect(() => {
    const srcs = ["/JAL.gif", "/JALSOL.gif", "/VAULT.gif", "/HOW-IT-WORKS.gif"];
    const imgs: HTMLImageElement[] = srcs.map((src) => {
      const i = new Image();
      i.src = src;
      return i;
    });
    return () => imgs.forEach((i) => (i.src = ""));
  }, []);

  // subtle merge animation on connect
  useEffect(() => {
    if (!connected || !publicKey) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setMerging(true);
    const delay = reducedMotion ? 0 : 350;
    timerRef.current = window.setTimeout(() => setMerging(false), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [connected, publicKey, reducedMotion]);

  // reset on disconnect
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  const tiles: { key: TileKey; title: string; sub?: string; gif: string }[] = [
    { key: "jal",   title: "JAL",            sub: "About & Swap",       gif: "/JAL.gif" },
    { key: "shop",  title: "JAL/SOL — SHOP", sub: "Buy items with JAL", gif: "/JALSOL.gif" },
    { key: "vault", title: "VAULT",          sub: "Your assets",        gif: "/VAULT.gif" },
  ];

  const openPanel = (id: LandingProps["initialPanel"]) => setActivePanel(id);

  const panelTitle =
    activePanel === "shop"  ? "Shop"  :
    activePanel === "jal"   ? "JAL"   :
    activePanel === "vault" ? "Vault" : "Welcome";

  return (
    <main className={`landing ${merging ? "is-merging" : ""}`} aria-live="polite">
      {/* Floating social row */}
      <nav className="landing-social" aria-label="Social links">
        <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
          <img src="/icons/X.png" alt="" />
        </a>
        <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <img src="/icons/Telegram.png" alt="" />
        </a>
        <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <img src="/icons/TikTok.png" alt="" />
        </a>
      </nav>

      {/* Logo + wallet */}
      <header className={`landing-hero ${connected ? "wallet-connected" : ""}`}>
        <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        <p className="landing-tagline">Currency • Vault • Shop • Identity</p>

        {!connected ? (
          <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />
        ) : (
          <button
            className="landing-wallet"
            onClick={() => openPanel(activePanel === "none" ? "shop" : "none")}
            aria-label={activePanel === "none" ? "Open Hub" : "Back to Hub"}
          >
            {activePanel === "none" ? "Open Hub" : "Back to Hub"}
          </button>
        )}
        <span className="landing-cutline" aria-hidden />
      </header>

      {/* Disconnect quick action while merging */}
      {merging && (
        <div className="landing-disconnect">
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        </div>
      )}

      {/* Transparent Hub panel */}
      <section className="hub-panel hub-panel--fit" aria-label="JAL/SOL Hub">
        <div className="hub-panel-top">
          <h2 className="hub-title">{panelTitle}</h2>
          {connected && <WalletDisconnectButton className="hub-disconnect-btn" />}
        </div>

        <div className="hub-panel-body">
          {/* Uniform tiles */}
          <div className="hub-tiles">
            {tiles.map((t) => (
              <button
                key={t.key}
                type="button"
                className="hub-tile"
                onClick={() => openPanel(t.key)}
              >
                <img
                  src={t.gif}
                  alt=""
                  className="hub-tile-gif"
                  loading="lazy"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
                <div className="hub-tile-label">
                  <span className="hub-tile-title">{t.title}</span>
                  {t.sub && <span className="hub-tile-sub">{t.sub}</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="hub-content">
            {activePanel === "shop" && (
              <div className="card">
                <h3>Shop</h3>
                <p>🛒 Browse items purchasable with JAL. (Hook your product list here.)</p>
                <ul>
                  <li>Item A — 10 JAL</li>
                  <li>Item B — 25 JAL</li>
                  <li>Item C — 40 JAL</li>
                </ul>
              </div>
            )}

            {activePanel === "jal" && (
              <div className="card">
                <h3>JAL</h3>
                <p>Learn about JAL and swap SOL ⇄ JAL from here.</p>
                {/* <Jal inHub /> */}
              </div>
            )}

            {activePanel === "vault" && (
              <div className="card">
                <h3>Vault</h3>
                <p>View balances, recent activity, and manage your JAL.</p>
              </div>
            )}

            {activePanel === "none" && (
              <div className="card">
                <h3>Welcome to JAL/SOL</h3>
                <p>
                  Connect your wallet to unlock features. Then pick a tile above — try <strong>JAL/SOL — SHOP</strong> to
                  see in-panel shopping.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
