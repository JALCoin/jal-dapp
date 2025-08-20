// src/pages/Landing.tsx
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import Jal from "./Jal"; // render JAL inside the hub

/* ----------------------------------------
   Panel state:
   - "none": landing preview (hub hidden)
   - "grid": hub open with tile grid
   - "shop" | "jal" | "vault": panel content
---------------------------------------- */
type Panel = "none" | "grid" | "shop" | "jal" | "vault";
type TileKey = Exclude<Panel, "none" | "grid">;

type LandingProps = {
  /** optional: open a specific panel on initial load (overridden by ?panel=) */
  initialPanel?: Panel;
};

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected, wallet } = useWallet();
  const [params, setParams] = useSearchParams();

  const [merging, setMerging] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const timerRef = useRef<number | null>(null);

  // scroll target for hub panel body
  const hubBodyRef = useRef<HTMLDivElement | null>(null);

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

  // ---- Preload GIFs ----
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
    const isPanel = (v: any): v is Panel => ["none", "grid", "shop", "jal", "vault"].includes(v);
    const start: Panel =
      (fromUrl && isPanel(fromUrl) ? fromUrl : null) ??
      (fromSession && isPanel(fromSession) ? fromSession : null) ??
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

  // ---- Connect event → merge + open grid if closed ----
  useEffect(() => {
    if (!wallet?.adapter) return;

    const onConnect = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMerging(true);
      const delay = reducedMotion ? 0 : 350;
      timerRef.current = window.setTimeout(() => setMerging(false), delay);
      setActivePanel((p) => (p === "none" ? "grid" : p));
    };

    wallet.adapter.on("connect", onConnect);
    return () => {
      wallet.adapter.off("connect", onConnect);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [wallet, reducedMotion]);

  // ---- Subtle merge animation on (auto)connect restore ----
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
      setActivePanel("none");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  // ---- ESC closes any open panel back to preview ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activePanel !== "none") setActivePanel("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePanel]);

  // ---- When switching panels, ensure hub body scroll is at top ----
  useEffect(() => {
    if (!hubBodyRef.current) return;
    hubBodyRef.current.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [activePanel, reducedMotion]);

  const openPanel = (id: Panel) => setActivePanel(id);

  const panelTitle =
    activePanel === "grid" ? "Hub" :
    activePanel === "shop" ? "Shop" :
    activePanel === "jal"  ? "JAL"  :
    activePanel === "vault"? "Vault": "Welcome";

  const isPreview = activePanel === "none";

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

      {/* === CENTERED LOGO + CONNECT/OPEN HUB BUTTON === */}
      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${connected ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {!connected ? (
          <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />
        ) : (
          <button
            className="landing-wallet"
            onClick={() => openPanel(isPreview ? "grid" : "none")}
            aria-expanded={!isPreview}
            aria-controls="hub-panel"
          >
            {isPreview ? "Open Hub" : "Back to Landing"}
          </button>
        )}
      </div>

      {/* === HUB CONTAINER === */}
      <section
        id="hub-panel"
        className={[
          "hub-panel",
          "hub-panel--fit",
          isPreview ? "landing-panel hub-preview" : "",
        ].join(" ")}
        aria-label="JAL/SOL Hub"
        aria-live="polite"
        // Prevent focus/interaction when previewed/hidden
        {...(isPreview ? { inert: true as any } : {})}
      >
        <div className="hub-panel-top">
          <h2 className="hub-title">{panelTitle}</h2>
          {connected && <WalletDisconnectButton className="hub-disconnect-btn" />}
        </div>

        <div className="hub-panel-body" ref={hubBodyRef}>
          {/* Tile grid — ONLY in explicit 'grid' mode */}
          {activePanel === "grid" && (
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
          )}

          {/* Panel body content */}
          <div className="hub-content">
            {activePanel === "shop" && (
              <div className="card">
                <h3>Shop</h3>
                <p>🛒 Browse items purchasable with JAL. (Hook your product list here.)</p>
              </div>
            )}

            {activePanel === "jal" && (
              <div className="in-hub">
                <Suspense fallback={<div className="card">Loading JAL…</div>}>
                  <Jal inHub />
                </Suspense>
              </div>
            )}

            {activePanel === "vault" && (
              <div className="card">
                <h3>Vault</h3>
                <p>View balances, recent activity, and manage your JAL.</p>
              </div>
            )}

            {isPreview && (
              <div className="card">
                <h3>Welcome to JAL/SOL</h3>
                <p>
                  Connect your wallet to unlock features. Then open the Hub to pick a tile —
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
