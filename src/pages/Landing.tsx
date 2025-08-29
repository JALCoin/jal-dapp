// src/pages/Landing.tsx
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const Jal = lazy(() => import("./Jal"));

type Panel = "none" | "grid" | "shop" | "jal" | "vault" | "payments" | "loans" | "support";
type TileKey = Exclude<Panel, "none" | "grid">;

type LandingProps = { initialPanel?: Panel };

const PHANTOM_WALLET = "Phantom" as WalletName;
const WALLET_MODAL_SELECTORS =
  '.wallet-adapter-modal, .wallet-adapter-modal-container, .wcm-modal, [class*="walletconnect"]';

/* ---------- Small helpers ---------- */
function DisconnectButton({ className }: { className?: string }) {
  const { connected, disconnect } = useWallet();
  if (!connected) return null;
  return (
    <button
      type="button"
      className={className ?? "wallet-disconnect-btn"}
      onClick={async () => {
        try {
          await disconnect();
        } catch (e) {
          console.error("[wallet] disconnect error:", e);
        }
      }}
      aria-label="Disconnect wallet"
    >
      Disconnect
    </button>
  );
}

function ConnectButton({ className }: { className?: string }) {
  const { select, connect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  const isMobile = useMemo(
    () =>
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      navigator.userAgent.includes("Mobile"),
    []
  );

  const onClick = async () => {
    try {
      if (isMobile) {
        sessionStorage.setItem("pendingWallet", PHANTOM_WALLET);
        if (!wallet || wallet.adapter?.name !== PHANTOM_WALLET) {
          await select?.(PHANTOM_WALLET);
          await new Promise((r) => setTimeout(r, 0));
        }
        await connect?.();
      } else {
        setVisible(true);
      }
    } catch (e) {
      console.error("[wallet] connect error:", e);
      sessionStorage.removeItem("pendingWallet");
    }
  };

  return (
    <button type="button" className={className ?? "landing-wallet"} onClick={onClick}>
      Connect Wallet
    </button>
  );
}

/* ---------- Page ---------- */
export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected, connecting, wallet, select, connect } = useWallet();
  const [params, setParams] = useSearchParams();

  const [activePanel, setActivePanel] = useState<Panel>("none");
  const [merging, setMerging] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Refs for focus/scroll management
  const hubBodyRef = useRef<HTMLDivElement | null>(null);
  const hubTitleRef = useRef<HTMLHeadingElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const tiles = useMemo<
    { key: TileKey; title: string; sub?: string; gif: string; disabled?: boolean }[]
  >(
    () => [
      { key: "jal", title: "JAL", sub: "About & Swap", gif: "/JAL.gif" },
      { key: "shop", title: "JAL/SOL — SHOP", sub: "Buy items with JAL", gif: "/JALSOL.gif" },
      { key: "vault", title: "VAULT", sub: "Your assets", gif: "/VAULT.gif" },
    ],
    []
  );

  /* ---------- Asset preload ---------- */
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

  /* ---------- Initial panel: URL ?panel > session > prop ---------- */
  useEffect(() => {
    const fromUrl = params.get("panel") as Panel | null;
    const fromSession = (sessionStorage.getItem("landing:lastPanel") as Panel | null) ?? null;
    const isPanel = (v: unknown): v is Panel =>
      v === "none" || v === "grid" || v === "shop" || v === "jal" || v === "vault" ||
      v === "payments" || v === "loans" || v === "support";

    const start: Panel =
      (fromUrl && isPanel(fromUrl) ? fromUrl : null) ??
      (fromSession && isPanel(fromSession) ? fromSession : null) ??
      initialPanel;

    setActivePanel(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Sync URL + session ---------- */
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

  /* ---------- On adapter connect ---------- */
  useEffect(() => {
    if (!wallet?.adapter) return;

    const onConnect = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMerging(true);
      const delay = reducedMotion ? 0 : 350;
      timerRef.current = window.setTimeout(() => setMerging(false), delay);

      setActivePanel((p) => (p === "none" ? "grid" : p));
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start",
        })
      );
    };

    wallet.adapter.on("connect", onConnect);
    return () => {
      wallet.adapter.off("connect", onConnect);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [wallet, reducedMotion]);

  /* ---------- Open grid on first connected ---------- */
  const wasConnected = useRef(false);
  useEffect(() => {
    if (connected && publicKey && !wasConnected.current) {
      setActivePanel((p) => (p === "none" ? "grid" : p));
    }
    wasConnected.current = connected;
  }, [connected, publicKey]);

  /* ---------- Subtle merge pulse on resume ---------- */
  useEffect(() => {
    if (!connected || !publicKey) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setMerging(true);
    const delay = reducedMotion ? 0 : 350;
    timerRef.current = window.setTimeout(() => setMerging(false), delay);
  }, [connected, publicKey, reducedMotion]);

  /* ---------- Reset on disconnect ---------- */
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      setActivePanel("none");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  /* ---------- ESC navigation ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activePanel !== "grid" && activePanel !== "none") {
        setActivePanel("grid");
      } else if (activePanel === "grid") {
        setActivePanel("none");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePanel]);

  /* ---------- Body flag while wallet modal is visible ---------- */
  const setWalletFlag = useCallback((on: boolean) => {
    const root = document.body;
    if (on) root.setAttribute("data-wallet-visible", "true");
    else root.removeAttribute("data-wallet-visible");
  }, []);
  useEffect(() => {
    const check = () => setWalletFlag(!!document.querySelector(WALLET_MODAL_SELECTORS));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      setWalletFlag(false);
    };
  }, [setWalletFlag]);

  /* ---------- Mobile resume (Phantom) ---------- */
  useEffect(() => {
    const tryResume = async () => {
      const pending = sessionStorage.getItem("pendingWallet");
      if (!pending || connected || connecting) return;

      if (pending === PHANTOM_WALLET) {
        try {
          if (!wallet || wallet.adapter?.name !== PHANTOM_WALLET) {
            await select?.(PHANTOM_WALLET);
            await new Promise((r) => setTimeout(r, 0));
          }
          await connect?.();
          sessionStorage.removeItem("pendingWallet");
        } catch (e) {
          console.info("[wallet] resume connect failed:", e);
        }
      }
    };

    const onVisible = () => void tryResume();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    void tryResume();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [connected, connecting, wallet, select, connect]);

  /* ---------- Helpers ---------- */
  const openPanel = (id: Panel) => {
    setActivePanel(id);
    requestAnimationFrame(() =>
      panelRef.current?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      })
    );
  };

  const panelTitle =
    activePanel === "grid"
      ? "Hub"
      : activePanel === "shop"
      ? "Shop"
      : activePanel === "jal"
      ? "JAL"
      : activePanel === "vault"
      ? "Vault"
      : activePanel === "payments"
      ? "Payments"
      : activePanel === "loans"
      ? "Loans"
      : activePanel === "support"
      ? "Support"
      : "Welcome";

  /* ---------- Fake balances (visuals only) ---------- */
  const [everyday, setEveryday] = useState<number>(781.0);
  const [savings, setSavings] = useState<number>(853.0);
  useEffect(() => {
    // Tiny drift for life—can replace with real data later.
    const t = setInterval(() => {
      setEveryday((v) => Math.max(0, v + (Math.random() - 0.5) * 0.2));
      setSavings((v) => Math.max(0, v + (Math.random() - 0.5) * 0.2));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const format = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ===========================================================
     Render
  ============================================================ */
  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">

      {/* ===== Top banking-style landing ===== */}
      <section className="bank-landing container" aria-label="Account overview">
        {/* Small status row (socials moved to header; we mirror the banking “status”) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.9 }}>
          <h1 style={{ margin: 0, fontSize: "1rem", letterSpacing: ".06em" }}>JALSOL</h1>
          <div style={{ fontSize: ".95rem", opacity: 0.9 }}>
            {connected ? "WALLET CONNECTED" : "WALLET NOT CONNECTED"}
          </div>
        </div>

        {/* Two balances */}
        <div className="balance-row">
          <div className="balance-card">
            <div className="balance-amount">${format(everyday)}</div>
            <div className="balance-label">Everyday Funds</div>
          </div>
          <div className="balance-card">
            <div className="balance-amount">${format(savings)}</div>
            <div className="balance-label">Savings</div>
          </div>
        </div>

        {/* 2x2 feature grid */}
        <div className="feature-grid">
          <button className="feature-card" onClick={() => openPanel("jal")} aria-label="Open JAL">
            <h4>JAL</h4>
            <div className="title">About & Swap</div>
            <div className="icon">➕</div>
          </button>

          <button className="feature-card" onClick={() => openPanel("shop")} aria-label="Open Store">
            <h4>Store</h4>
            <div className="title">Buy with JAL</div>
            <div className="icon">🏬</div>
          </button>

          <button className="feature-card" onClick={() => openPanel("vault")} aria-label="Open Vault">
            <h4>Vault</h4>
            <div className="title">Assets & Activity</div>
            <div className="icon">💳</div>
          </button>

          <button className="feature-card" onClick={() => openPanel("grid")} aria-label="Open Hub">
            <h4>Hub</h4>
            <div className="title">All Panels</div>
            <div className="icon">🔗</div>
          </button>

          {/* Wide featured banner */}
          <div className="feature-card feature-wide">
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ opacity: 0.85 }}>Featured</div>
              <div className="title">Stay Scam Aware</div>
              <div style={{ opacity: 0.85 }}>Today • Eating &amp; Drinking Out</div>
            </div>
            <div className="icon" aria-hidden>⚠️</div>
          </div>
        </div>

        {/* Connect (if needed) */}
        {!connected && (
          <div>
            <ConnectButton />
          </div>
        )}
      </section>

      {/* ===== Embedded Hub panel (existing behavior retained) ===== */}
      <section
        id="hub-panel"
        className={`hub-panel hub-panel--fit ${activePanel === "none" ? "hub-preview" : ""}`}
        role={activePanel === "none" ? "region" : "dialog"}
        aria-modal={activePanel === "none" ? undefined : true}
        aria-label="JAL/SOL Hub"
        ref={panelRef as any}
      >
        <div className="hub-panel-top">
          <h2 className="hub-title" ref={hubTitleRef} tabIndex={-1}>
            {panelTitle}
          </h2>
          {connected && <DisconnectButton className="wallet-disconnect-btn" />}
        </div>

        <div className="hub-panel-body" ref={hubBodyRef}>
          {/* Tiles */}
          {connected && (activePanel === "grid" || activePanel === "none") && (
            <div className="hub-stack hub-stack--responsive" role="list">
              {tiles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="img-btn"
                  onClick={() => setActivePanel(t.key)}
                  role="listitem"
                  aria-describedby={`tile-sub-${t.key}`}
                  disabled={t.disabled}
                >
                  <img
                    src={t.gif}
                    alt=""
                    className="hub-gif"
                    loading="lazy"
                    width={960}
                    height={540}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="hub-btn">
                    {t.title}
                    {t.sub && <span id={`tile-sub-${t.key}`} className="sub">{t.sub}</span>}
                    {t.disabled && <span className="locked">Connect wallet to use</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Content area */}
          <div className="hub-content">
            {!connected && (
              <div className="card">
                <h3>Welcome to JAL/SOL</h3>
                <p>Connect your wallet to unlock features. Use the tiles above to explore.</p>
              </div>
            )}

            {connected && activePanel === "shop" && (
              <>
                <div className="card">
                  <h3>Shop</h3>
                  <p>🛒 Browse items purchasable with JAL. (Hook your product list here.)</p>
                  <button className="button ghost" onClick={() => setActivePanel("grid")}>← Back to Hub</button>
                </div>
              </>
            )}

            {connected && activePanel === "jal" && (
              <>
                <div className="in-hub">
                  <Suspense fallback={<div className="card">Loading JAL…</div>}>
                    <Jal inHub />
                  </Suspense>
                </div>
                <button className="button ghost" onClick={() => setActivePanel("grid")}>← Back to Hub</button>
              </>
            )}

            {connected && activePanel === "vault" && (
              <div className="card">
                <h3>Vault</h3>
                <p>View balances, recent activity, and manage your JAL.</p>
                <button className="button ghost" onClick={() => setActivePanel("grid")}>← Back to Hub</button>
              </div>
            )}

            {/* Placeholder panels for tabbar parity */}
            {connected && (activePanel === "payments" || activePanel === "loans" || activePanel === "support") && (
              <div className="card">
                <h3>{panelTitle}</h3>
                <p>Coming soon.</p>
                <button className="button ghost" onClick={() => setActivePanel("grid")}>← Back to Hub</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
