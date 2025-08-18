// src/pages/Landing.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";

type LandingProps = {
  /** optional deep link: open a specific panel on load */
  initialPanel?: "none" | "shop" | "jal" | "vault" | "store";
};

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [merging, setMerging] = useState(false);
  const [activePanel, setActivePanel] = useState<LandingProps["initialPanel"]>(initialPanel);
  const timerRef = useRef<number | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // preload hub images
  useEffect(() => {
    const imgs = ["/JAL.gif", "/JALSOL.gif", "/VAULT.gif", "/HOW-IT-WORKS.gif"];
    const elms: HTMLImageElement[] = [];
    imgs.forEach((src) => { const img = new Image(); img.src = src; elms.push(img); });
    return () => { elms.forEach((img) => (img.src = "")); };
  }, []);

  // if user connects, do the subtle merge → but keep them on landing so panel stays visible
  useEffect(() => {
    if (!connected || !publicKey) return;
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setMerging(true);
    const delay = reducedMotion ? 0 : 350;
    timerRef.current = window.setTimeout(() => setMerging(false), delay);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = null; };
  }, [connected, publicKey, reducedMotion]);

  // reset when disconnected
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  // ---- helpers
  const openPanel = (id: LandingProps["initialPanel"]) => {
    setActivePanel(id);
    // keep URL in sync for deep-linking UX (optional)
    if (id === "shop") navigate("/shop", { replace: true });
    else if (id === "jal") navigate("/jal", { replace: true });
    else if (id === "vault") navigate("/dashboard", { replace: true }); // or a dedicated route if you want
    else navigate("/", { replace: true });
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

      {/* --- Transparent Hub panel right on the landing page --- */}
      <section
        className="hub-panel hub-panel--fit"
        aria-label="JAL/SOL Hub"
        style={{ marginTop: 16, width: "min(980px, 92vw)" }}
      >
        {/* header / top row */}
        <div className="hub-panel-top">
          <h2 className="hub-title" style={{ margin: "0 auto" }}>
            {activePanel === "shop" ? "Shop" :
             activePanel === "jal" ? "JAL" :
             activePanel === "vault" ? "Vault" :
             "Welcome"}
          </h2>

          {/* optional disconnect when connected */}
          {connected && <WalletDisconnectButton className="hub-disconnect-btn" />}
        </div>

        {/* body is scrollable */}
        <div className="hub-panel-body" style={{ overflowY: "auto" }}>
          {/* Actions row */}
          <div className="hub-stack hub-stack--responsive" style={{ gridTemplateColumns: "1fr 1fr", display: "grid" }}>
            {/* STORE (disabled/blurred until your condition is met) */}
            <button
              className="hub-btn"
              type="button"
              onClick={() => openPanel("store")}
              aria-disabled={!connected}
              style={!connected ? { filter: "blur(2px) opacity(.6)", pointerEvents: "none" } : undefined}
            >
              STORE
              <span className="sub">Merch & more</span>
            </button>

            {/* JAL */}
            <button
              className="hub-btn"
              type="button"
              onClick={() => openPanel("jal")}
            >
              JAL
              <span className="sub">About & Swap</span>
            </button>

            {/* JAL/SOL (SHOP) */}
            <button
              className="hub-btn"
              type="button"
              onClick={() => openPanel("shop")}
            >
              JAL/SOL — SHOP
              <span className="sub">Buy items with JAL</span>
            </button>

            {/* VAULT */}
            <button
              className="hub-btn"
              type="button"
              onClick={() => openPanel("vault")}
            >
              VAULT
              <span className="sub">Your assets</span>
            </button>
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
                {/* You can embed your <Jal inHub /> if you want the modal swap: */}
                {/* <Jal inHub /> */}
              </div>
            )}

            {activePanel === "vault" && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Vault</h3>
                <p>View balances, recent activity, and manage your JAL.</p>
                {/* You could render a small Vault summary or link to /dashboard */}
              </div>
            )}

            {(activePanel === "none" || activePanel === "store") && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>
                  {activePanel === "store" ? "Store" : "Welcome to JAL/SOL"}
                </h3>
                <p>
                  Connect your wallet to unlock features. Then pick a tile above —
                  try <strong>JAL/SOL — SHOP</strong> to see in-panel shopping.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
