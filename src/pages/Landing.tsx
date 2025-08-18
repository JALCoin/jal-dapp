// src/pages/Landing.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";

type LandingProps = {
  /** optional deep link: open a specific panel on load (local state only) */
  initialPanel?: "none" | "shop" | "jal" | "vault" | "store";
};

type TileKey = Exclude<Required<LandingProps>["initialPanel"], "none">;

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected } = useWallet();

  const [merging, setMerging] = useState(false);
  const [activePanel, setActivePanel] = useState<LandingProps["initialPanel"]>(
    initialPanel
  );
  const timerRef = useRef<number | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // --- Preload GIFs for the hub tiles ---
  useEffect(() => {
    const imgs = ["/STORE.gif", "/JAL.gif", "/JALSOL.gif", "/VAULT.gif", "/HOW-IT-WORKS.gif"];
    const elms: HTMLImageElement[] = [];
    imgs.forEach((src) => {
      const img = new Image();
      img.src = src;
      elms.push(img);
    });
    return () => {
      elms.forEach((img) => (img.src = ""));
    };
  }, []);

  // subtle merge animation when a wallet connects (stay on landing)
  useEffect(() => {
    if (!connected || !publicKey) return;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMerging(true);
    const delay = reducedMotion ? 0 : 350;
    timerRef.current = window.setTimeout(() => setMerging(false), delay);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [connected, publicKey, reducedMotion]);

  // reset when disconnected
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  // hub tiles (single column, each with a GIF)
  const tiles: { key: TileKey; title: string; sub?: string; gif: string }[] = [
    { key: "store", title: "STORE",          sub: "Merch & more",         gif: "/STORE.gif" },
    { key: "jal",   title: "JAL",            sub: "About & Swap",         gif: "/JAL.gif" },
    { key: "shop",  title: "JAL/SOL — SHOP", sub: "Buy items with JAL",   gif: "/JALSOL.gif" },
    { key: "vault", title: "VAULT",          sub: "Your assets",          gif: "/VAULT.gif" },
    // If you want HOW IT WORKS as a tile later, add it here with "/HOW-IT-WORKS.gif"
  ];

  const openPanel = (id: LandingProps["initialPanel"]) => {
    setActivePanel(id); // local state only (no navigation changes)
  };

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
      {/* top social row */}
      <div className="landing-social" aria-hidden={merging}>
        <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
          <img src="/icons/X.png" alt="" />
        </a>
        <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <img src="/icons/Telegram.png" alt="" />
        </a>
        <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <img src="/icons/TikTok.png" alt="" />
        </a>
      </div>

      {merging && (
        <div className="landing-disconnect">
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        </div>
      )}

      {/* logo + wallet */}
      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${connected ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {!connected ? (
          <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />
        ) : (
          <button
            className="landing-wallet"
            onClick={() => openPanel(activePanel === "none" ? "shop" : activePanel)}
            aria-label="Open Hub panel"
          >
            {activePanel === "none" ? "Open Hub" : "Back to Hub"}
          </button>
        )}
      </div>

      {/* --- Transparent Hub panel on the landing page --- */}
      <section
        className="hub-panel hub-panel--fit"
        aria-label="JAL/SOL Hub"
        style={{ marginTop: 16, width: "min(980px, 92vw)" }}
      >
        <div className="hub-panel-top">
          <h2 className="hub-title" style={{ margin: "0 auto" }}>
            {activePanel === "shop" ? "Shop" :
             activePanel === "jal" ? "JAL" :
             activePanel === "vault" ? "Vault" :
             activePanel === "store" ? "Store" : "Welcome"}
          </h2>

          {connected && <WalletDisconnectButton className="hub-disconnect-btn" />}
        </div>

        {/* body scrolls */}
        <div className="hub-panel-body" style={{ overflowY: "auto" }}>
          {/* Single-column tile list with GIFs */}
          <div
            className="hub-stack hub-stack--responsive"
            style={{ display: "grid", gridTemplateColumns: "1fr" }}
          >
            {tiles.map((t) => {
              const disabled = t.key === "store" && !connected; // example: lock STORE until connected
              return (
                <button
                  key={t.key}
                  type="button"
                  className="img-btn"
                  onClick={() => openPanel(t.key)}
                  aria-disabled={disabled}
                  style={disabled ? { filter: "blur(2px) opacity(.6)", pointerEvents: "none" } : undefined}
                >
                  <img
                    src={t.gif}
                    alt=""
                    className="hub-gif hub-gif--cover"
                    loading="lazy"
                    onError={(e) => {
                      // hide image if missing but keep the text button visible
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="hub-btn" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    {t.title}
                    {t.sub && <span className="sub">{t.sub}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel content */}
          <div className="hub-content" style={{ marginTop: 16 }}>
            {activePanel === "shop" && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Shop</h3>
                <p>🛒 Browse items purchasable with JAL. (Hook your product list here.)</p>
                <ul style={{ marginTop: 8 }}>
                  <li>Item A — 10 JAL</li>
                  <li>Item B — 25 JAL</li>
                  <li>Item C — 40 JAL</li>
                </ul>
              </div>
            )}

            {activePanel === "jal" && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>JAL</h3>
                <p>Learn about JAL and swap SOL ⇄ JAL from here.</p>
                {/* To embed the full JAL page in-panel, uncomment: */}
                {/* <Jal inHub /> */}
              </div>
            )}

            {activePanel === "vault" && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Vault</h3>
                <p>View balances, recent activity, and manage your JAL.</p>
              </div>
            )}

            {(activePanel === "none" || activePanel === "store") && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>
                  {activePanel === "store" ? "Store" : "Welcome to JAL/SOL"}
                </h3>
                <p>
                  Connect your wallet to unlock features. Then pick a tile above — try{" "}
                  <strong>JAL/SOL — SHOP</strong> to see in-panel shopping.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
