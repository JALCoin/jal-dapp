// src/pages/Landing.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

type Panel = "none" | "shop" | "jal" | "vault";
type TileKey = Exclude<Panel, "none">;

type LandingProps = {
  /** optional: open a specific panel on initial load (overridden by ?panel=) */
  initialPanel?: Panel;
};

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected } = useWallet();
  const [params, setParams] = useSearchParams();

  const [merging, setMerging] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const timerRef = useRef<number | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // ---- Tiles ----
  const tiles: { key: TileKey; title: string; sub?: string; gif: string }[] = [
    { key: "jal", title: "JAL", sub: "About & Swap", gif: "/JAL.gif" },
    { key: "shop", title: "JAL/SOL — SHOP", sub: "Buy items with JAL", gif: "/JALSOL.gif" },
    { key: "vault", title: "VAULT", sub: "Your assets", gif: "/VAULT.gif" },
  ];

  // ---- Preload GIFs (cleanup on unmount) ----
  useEffect(() => {
    const imgs = tiles.map((t) => {
      const i = new Image();
      i.decoding = "async";
      i.loading = "eager";
      i.src = t.gif;
      return i;
    });
    return () => imgs.forEach((i) => (i.src = ""));
  }, [tiles]);

  // ---- Resolve starting panel: URL ?panel > session > prop ----
  useEffect(() => {
    const fromUrl = params.get("panel") as Panel | null;
    const fromSession = (sessionStorage.getItem("landing:lastPanel") as Panel | null) ?? null;
    const start: Panel =
      (fromUrl && ["none", "shop", "jal", "vault"].includes(fromUrl) ? fromUrl : null) ??
      (fromSession && ["none", "shop", "jal", "vault"].includes(fromSession) ? fromSession : null) ??
      initialPanel;
    setActivePanel(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Keep URL + session in sync ----
  useEffect(() => {
    if (!activePanel) return;
    sessionStorage.setItem("landing:lastPanel", activePanel);
    const urlPanel = params.get("panel");
    if (activePanel === "none") {
      if (urlPanel) {
        params.delete("panel");
        setParams(params, { replace: true });
      }
    } else if (urlPanel !== activePanel) {
      params.set("panel", activePanel);
      setParams(params, { replace: true });
    }
  }, [activePanel, params, setParams]);

  // ---- Subtle merge animation on connect (stays on landing) ----
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

  // ---- Reset on disconnect ----
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  // ---- ESC closes any open panel back to hub ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activePanel !== "none") setActivePanel("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePanel]);

  const openPanel = (id: Panel) => setActivePanel(id);

  const panelTitle =
    activePanel === "shop" ? "Shop" : activePanel === "jal" ? "JAL" : activePanel === "vault" ? "Vault" : "Welcome";

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
      {/* top-center social row */}
      <div className="landing-social" aria-hidden={merging}>
        <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
          <img src="/icons/X.png" alt="" width={20} height={20} />
        </a>
        <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <img src="/icons/Telegram.png" alt="" width={20} height={20} />
        </a>
        <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <img src="/icons/TikTok.png" alt="" width={20} height={20} />
        </a>
      </div>

      {merging && (
        <div className="landing-disconnect">
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        </div>
      )}

      {/* === CENTERED LOGO + CONNECT BUTTON === */}
      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${connected ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

      {!connected ? (
        <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />
      ) : (
        <button
          className="landing-wallet"
          onClick={() => openPanel(activePanel === "none" ? "shop" : "none")}
          aria-expanded={activePanel !== "none"}
          aria-controls="hub-panel"
        >
          {activePanel === "none" ? "Open Hub" : "Back to Hub"}
        </button>
      )}
      </div>

      {/* === TRANSPARENT HUB CONTAINER (in-panel pages) === */}
      <section
        id="hub-panel"
        className={[
          "hub-panel",
          "hub-panel--fit",
          activePanel === "none" ? "landing-panel hub-preview" : "",
        ].join(" ")}
        aria-label="JAL/SOL Hub"
      >
        <div className="hub-panel-top">
          <h2 className="hub-title">{panelTitle}</h2>
          {connected && <WalletDisconnectButton className="hub-disconnect-btn" />}
        </div>

        <div className="hub-panel-body">
          {/* tiles list (overlay style) */}
          <div className="hub-stack hub-stack--responsive" role="list">
            {tiles.map((t) => (
              <button
                key={t.key}
                type="button"
                className="img-btn"
                onClick={() => openPanel(t.key)}
                role="listitem"
              >
                <img
                  src={t.gif}
                  alt=""
                  className="hub-gif float"
                  loading="lazy"
                  width={960}
                  height={540}
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
                <div className="hub-btn">
                  {t.title}
                  {t.sub && <span className="sub">{t.sub}</span>}
                </div>
              </button>
            ))}
          </div>

          {/* panel body content */}
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
