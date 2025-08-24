// src/pages/Landing.tsx
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
  useWalletModal, // ⬅️ added
} from "@solana/wallet-adapter-react-ui";

// Lazy-load the heavy JAL page when needed
const Jal = lazy(() => import("./Jal"));

/* ----------------------------------------
   Panel state
----------------------------------------- */
type Panel = "none" | "grid" | "shop" | "jal" | "vault";
type TileKey = Exclude<Panel, "none" | "grid">;

type LandingProps = {
  /** optionally open a specific panel on initial load (overridden by ?panel=) */
  initialPanel?: Panel;
};

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected, wallet } = useWallet();
  const walletModal = useWalletModal(); // ⬅️ added
  const [params, setParams] = useSearchParams();

  const [merging, setMerging] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const timerRef = useRef<number | null>(null);

  // Refs for focus/scroll management
  const hubBodyRef = useRef<HTMLDivElement | null>(null);
  const hubTitleRef = useRef<HTMLHeadingElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Static tiles (memoized so effects don't re-run)
  const tiles = useMemo<
    { key: TileKey; title: string; sub?: string; gif: string }[]
  >(
    () => [
      { key: "jal", title: "JAL", sub: "About & Swap", gif: "/JAL.gif" },
      {
        key: "shop",
        title: "JAL/SOL — SHOP",
        sub: "Buy items with JAL",
        gif: "/JALSOL.gif",
      },
      { key: "vault", title: "VAULT", sub: "Your assets", gif: "/VAULT.gif" },
    ],
    []
  );

  // Preload GIFs once
  useEffect(() => {
    const imgs = tiles.map((t) => {
      const i = new Image();
      i.decoding = "async";
      i.loading = "eager";
      i.src = t.gif;
      return i;
    });
    return () => imgs.forEach((i) => (i.src = "")); // help GC on route change
  }, [tiles]);

  // Resolve starting panel: URL ?panel > session > prop
  useEffect(() => {
    const fromUrl = params.get("panel") as Panel | null;
    const fromSession =
      (sessionStorage.getItem("landing:lastPanel") as Panel | null) ?? null;
    const isPanel = (v: unknown): v is Panel =>
      v === "none" || v === "grid" || v === "shop" || v === "jal" || v === "vault";

    const start: Panel =
      (fromUrl && isPanel(fromUrl) ? fromUrl : null) ??
      (fromSession && isPanel(fromSession) ? fromSession : null) ??
      initialPanel;

    setActivePanel(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL + session in sync
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

  // Wallet connect → subtle merge + open grid if closed
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

  // Subtle merge on autoconnect restore
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

  // Reset on disconnect
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (activePanel !== "none") {
        requestAnimationFrame(() => toggleBtnRef.current?.focus?.());
      }
      setActivePanel("none");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  // ESC closes any open panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activePanel !== "none") {
        setActivePanel("none");
        requestAnimationFrame(() => toggleBtnRef.current?.focus?.());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePanel]);

  // When switching panels, scroll to top & focus heading
  useEffect(() => {
    if (hubBodyRef.current) {
      hubBodyRef.current.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
    if (activePanel !== "none") {
      requestAnimationFrame(() => hubTitleRef.current?.focus?.());
    }
  }, [activePanel, reducedMotion]);

  // Auto-open wallet modal once per session if not connected (mobile-friendly prompt)
  useEffect(() => {
    const KEY = "wallet:autoPrompted";
    const already = sessionStorage.getItem(KEY);
    if (!connected && !already) {
      try {
        walletModal.setVisible(true);
        sessionStorage.setItem(KEY, "1");
      } catch {
        // ignore
      }
    }
  }, [connected, walletModal]);

  // Keep body flag in sync with modal visibility (so index.css blur/freeze applies)
  useEffect(() => {
    const root = document.body;
    if (walletModal.visible) {
      root.setAttribute("data-wallet-visible", "true");
    } else {
      root.removeAttribute("data-wallet-visible");
    }
    return () => {
      root.removeAttribute("data-wallet-visible");
    };
  }, [walletModal.visible]);

  // Helpers
  const openPanel = useCallback((id: Panel) => {
    setActivePanel(id);
    if (id === "none") requestAnimationFrame(() => toggleBtnRef.current?.focus?.());
  }, []);

  const panelTitle =
    activePanel === "grid"
      ? "Hub"
      : activePanel === "shop"
      ? "Shop"
      : activePanel === "jal"
      ? "JAL"
      : activePanel === "vault"
      ? "Vault"
      : "Welcome";

  const isPreview = activePanel === "none";
  const showOverlay = !isPreview; // hub floats over landing

  return (
    <main
      className={`landing-gradient ${merging ? "landing-merge" : ""}`}
      aria-live="polite"
    >
      {/* top-center social row */}
      <div className="landing-social" aria-hidden={merging}>
        <a
          href="https://x.com/JAL358"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
        >
          <img src="/icons/X.png" alt="" width={20} height={20} />
        </a>
        <a
          href="https://t.me/jalsolcommute"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Telegram"
        >
          <img src="/icons/Telegram.png" alt="" width={20} height={20} />
        </a>
        <a
          href="https://www.tiktok.com/@358jalsol"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
        >
          <img src="/icons/TikTok.png" alt="" width={20} height={20} />
        </a>
      </div>

      {merging && (
        <div className="landing-disconnect">
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        </div>
      )}

      {/* landing hero stays visible at all times */}
      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${connected ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {!connected ? (
          <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />
        ) : (
          <button
            ref={toggleBtnRef}
            className="landing-wallet"
            onClick={() => openPanel(isPreview ? "grid" : "none")}
            aria-expanded={!isPreview}
            aria-controls="hub-panel"
          >
            {isPreview ? "Open Hub" : "Back to Landing"}
          </button>
        )}
      </div>

      {/* PREVIEW CARD: in normal flow when no overlay */}
      {isPreview && (
        <section
          id="hub-panel"
          className="hub-panel hub-panel--fit landing-panel hub-preview"
          role="region"
          aria-label="JAL/SOL Hub"
          aria-live="polite"
        >
          <div className="hub-panel-top">
            <h2 className="hub-title" tabIndex={-1}>
              {panelTitle}
            </h2>
            {connected && <WalletDisconnectButton className="hub-disconnect-btn" />}
          </div>
          <div className="hub-panel-body">
            <div className="hub-content">
              <div className="card">
                <h3>Welcome to JAL/SOL</h3>
                <p>
                  Connect your wallet to unlock features. Then open the Hub to pick a tile — try{" "}
                  <strong>JAL/SOL — SHOP</strong> to see in‑panel shopping.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* OVERLAY: floats above landing; landing remains visible behind */}
      {showOverlay && (
        <div className="hub-overlay" aria-hidden={undefined}>
          <section
            id="hub-panel"
            className="hub-panel hub-panel--fit"
            role="dialog"
            aria-modal="true"
            aria-label="JAL/SOL Hub"
          >
            <div className="hub-panel-top">
              <h2 className="hub-title" ref={hubTitleRef} tabIndex={-1}>
                {panelTitle}
              </h2>
              {connected && <WalletDisconnectButton className="hub-disconnect-btn" />}
            </div>

            <div className="hub-panel-body" ref={hubBodyRef}>
              {activePanel === "grid" && (
                <div className="hub-stack hub-stack--responsive" role="list">
                  {tiles.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className="img-btn"
                      onClick={() => openPanel(t.key)}
                      role="listitem"
                      aria-describedby={`tile-sub-${t.key}`}
                    >
                      <img
                        src={t.gif}
                        alt=""
                        className="hub-gif float"
                        loading="lazy"
                        width={960}
                        height={540}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="hub-btn">
                        {t.title}
                        {t.sub && (
                          <span id={`tile-sub-${t.key}`} className="sub">
                            {t.sub}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Panel content */}
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
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
