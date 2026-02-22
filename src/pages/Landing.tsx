import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const Jal = lazy(() => import("./Jal"));

type Panel = "none" | "grid" | "shop" | "jal" | "vault" | "support";
type TileKey = Exclude<Panel, "none">;

type LandingProps = { initialPanel?: Panel };

/** Replace if your JAL mint changes */
const JAL_MINT = new PublicKey("9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v");

const PHANTOM_WALLET = "Phantom" as WalletName; // placeholder for future deep-link use
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
        try { await disconnect(); }
        catch (e) { console.error("[wallet] disconnect error:", e); }
      }}
      aria-label="Disconnect wallet"
    >
      Disconnect
    </button>
  );
}

/** Official wallet adapter multi button */
function ConnectButton({ className }: { className?: string }) {
  return <WalletMultiButton className={className ?? "landing-wallet"} />;
}

/* ---------- Page ---------- */
export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected, connecting, wallet, select, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const [params, setParams] = useSearchParams();

  const [activePanel, setActivePanel] = useState<Panel>("none");
  const timerRef = useRef<number | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /* ---------- Tiles for Hub overlay ---------- */
  const tiles = useMemo<{ key: TileKey; title: string; sub?: string; gif?: string; disabled?: boolean }[]>(
    () => [
      { key: "jal", title: "JAL", sub: "About & Swap", gif: "/JAL.gif" },
      { key: "shop", title: "JAL/SOL — SHOP", sub: "Buy with JAL", gif: "/JALSOL.gif" },
      { key: "vault", title: "VAULT", sub: "Assets & Activity", gif: "/VAULT.gif" },
      { key: "support", title: "SUPPORT", sub: "Links & Help", gif: "/SUPPORT.gif" }, // optional: if missing, image will just hide
    ],
    []
  );

  /* ---------- Asset preload ---------- */
  useEffect(() => {
    const imgs = tiles
      .filter((t) => !!t.gif)
      .map((t) => {
        const i = new Image();
        i.decoding = "async";
        i.loading = "eager";
        i.src = t.gif as string;
        return i;
      });
    return () => imgs.forEach((i) => (i.src = ""));
  }, [tiles]);

  /* ---------- URL/session init ---------- */
  useEffect(() => {
    const fromUrl = params.get("panel") as Panel | null;
    const fromSession = (sessionStorage.getItem("landing:lastPanel") as Panel | null) ?? null;

    const isPanel = (v: unknown): v is Panel =>
      v === "none" || v === "grid" || v === "shop" || v === "jal" || v === "vault" || v === "support";

    const start: Panel =
      (fromUrl && isPanel(fromUrl) ? fromUrl : null) ??
      (fromSession && isPanel(fromSession) ? fromSession : null) ??
      initialPanel;

    setActivePanel(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem("landing:lastPanel", activePanel);
    const urlPanel = params.get("panel");

    if (activePanel === "none") {
      if (urlPanel) {
        params.delete("panel");
        setParams(params, { replace: true });
      }
      return;
    }

    if (urlPanel !== activePanel) {
      params.set("panel", activePanel);
      setParams(params, { replace: true });
    }
  }, [activePanel, params, setParams]);

  /* ---------- Wallet modal visibility flag ---------- */
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

  /* ---------- Mobile resume (Phantom deep link placeholder) ---------- */
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

  /* ---------- Overlay controls ---------- */
  const overlayOpen = activePanel !== "none";

  useEffect(() => {
    if (overlayOpen) document.body.setAttribute("data-hub-open", "true");
    else document.body.removeAttribute("data-hub-open");
    return () => document.body.removeAttribute("data-hub-open");
  }, [overlayOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlayOpen) setActivePanel("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  /* ---------- Open helpers ---------- */
  const requiresWallet: Panel[] = ["jal", "vault"];
  const openPanel = (id: Panel) => {
    setActivePanel(id);
    if (!connected && requiresWallet.includes(id)) setVisible(true);
  };

  const panelTitle =
    activePanel === "grid" ? "Hub" :
    activePanel === "shop" ? "Shop" :
    activePanel === "jal" ? "JAL" :
    activePanel === "vault" ? "Vault" :
    activePanel === "support" ? "Support" :
    "Home";

  /* ---------- LIVE BALANCES: JAL (SPL) + SOL ---------- */
  const [sol, setSol] = useState<number | null>(null);
  const [jal, setJal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBalances = async () => {
      if (!publicKey) { setSol(null); setJal(null); return; }

      const endpoint =
        (globalThis as any).__SOLANA_RPC_ENDPOINT__ ||
        "https://api.mainnet-beta.solana.com";

      const connection = new Connection(endpoint, "confirmed");

      try {
        const lamports = await connection.getBalance(publicKey, { commitment: "confirmed" });
        if (!cancelled) setSol(lamports / LAMPORTS_PER_SOL);
      } catch (e) {
        console.error("SOL balance fetch failed:", e);
        if (!cancelled) setSol(null);
      }

      try {
        const resp = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
        const totalJal = resp.value
          .filter((acc) => acc.account.data.parsed.info.mint === JAL_MINT.toBase58())
          .reduce((sum, acc) => {
            const amt = acc.account.data.parsed.info.tokenAmount;
            const ui = Number(amt.uiAmountString ?? amt.uiAmount ?? 0);
            return sum + (isFinite(ui) ? ui : 0);
          }, 0);
        if (!cancelled) setJal(totalJal);
      } catch (e) {
        console.error("JAL balance fetch failed:", e);
        if (!cancelled) setJal(null);
      }
    };

    void fetchBalances();
    const id = setInterval(fetchBalances, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, [publicKey]);

  const fmt = (n: number | null, digits = 4) =>
    n == null ? "--" : n.toLocaleString(undefined, { maximumFractionDigits: digits });

  /* ===========================================================
     Render
  ============================================================ */
  return (
    <div className="landing-gradient" aria-live="polite">
      {/* ===== ATM Home (ONLY) ===== */}
      <section className="bank-landing container" aria-label="Overview">
        <div className="bank-status">{connected ? "WALLET CONNECTED" : "WALLET NOT CONNECTED"}</div>

        <div className="balance-row">
          <div className="balance-card">
            <div className="balance-amount">{fmt(jal)} JAL</div>
            <div className="balance-label">JAL • Total</div>
          </div>
          <div className="balance-card">
            <div className="balance-amount">{fmt(sol)} SOL</div>
            <div className="balance-label">SOL • Total</div>
          </div>
        </div>

        <div className="feature-grid">
          <button className="feature-card" onClick={() => openPanel("jal")} aria-label="Open JAL">
            <h4>JAL</h4><div className="title">About &amp; Swap</div><div className="icon">➕</div>
          </button>

          <button className="feature-card" onClick={() => openPanel("shop")} aria-label="Open Store">
            <h4>Store</h4><div className="title">Buy with JAL</div><div className="icon">🏬</div>
          </button>

          <button className="feature-card" onClick={() => openPanel("vault")} aria-label="Open Vault">
            <h4>Vault</h4><div className="title">Assets &amp; Activity</div><div className="icon">💳</div>
          </button>

          <button className="feature-card" onClick={() => openPanel("grid")} aria-label="Open Hub">
            <h4>Hub</h4><div className="title">All Panels</div><div className="icon">🔗</div>
          </button>
        </div>

        {/* Single connect entry point on Home (no duplicates) */}
        {!connected && <ConnectButton />}
      </section>

      {/* ===== Overlay backdrop ===== */}
      {overlayOpen && (
        <button
          className="hub-overlay"
          aria-label="Close panel"
          onClick={() => setActivePanel("none")}
        />
      )}

      {/* ===== Overlay panel container ===== */}
      {overlayOpen && (
        <section
          className="hub-panel hub-panel--overlay"
          role="dialog"
          aria-modal="true"
          aria-label="JAL/SOL Panel"
        >
          <div className="hub-panel-top">
            <h2 className="hub-title">{panelTitle}</h2>

            {connected ? (
              <DisconnectButton className="wallet-disconnect-btn" />
            ) : (
              <ConnectButton className="wallet-disconnect-btn" />
            )}
          </div>

          <div className="hub-panel-body">
            {/* Back button for sub-panels */}
            {activePanel !== "grid" && (
              <div className="hub-controls">
                <button type="button" className="button ghost" onClick={() => setActivePanel("grid")}>
                  ← Back to Hub
                </button>
              </div>
            )}

            {/* HUB GRID */}
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
                    disabled={t.disabled}
                  >
                    {t.gif && (
                      <img
                        src={t.gif}
                        alt=""
                        className="hub-gif"
                        loading="lazy"
                        width={960}
                        height={540}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}

                    <div className="hub-btn">
                      {t.title}
                      {t.sub && <span id={`tile-sub-${t.key}`} className="sub">{t.sub}</span>}
                      {t.disabled && <span className="locked">Connect wallet to use</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="hub-content">
              {/* SHOP */}
              {activePanel === "shop" && (
                <div className="card">
                  <h3>Shop</h3>
                  <p>Browse items purchasable with JAL. (Hook your product list here.)</p>
                  {!connected && (
                    <p style={{ opacity: 0.85 }}>Preview mode — connect to checkout.</p>
                  )}
                </div>
              )}

              {/* JAL */}
              {activePanel === "jal" && (
                connected ? (
                  <div className="in-hub">
                    <Suspense fallback={<div className="card">Loading JAL…</div>}>
                      <Jal inHub />
                    </Suspense>
                  </div>
                ) : (
                  <div className="card">
                    <h3>JAL</h3>
                    <p>Connect to swap and access token tools.</p>
                    <ConnectButton className="button gold" />
                  </div>
                )
              )}

              {/* VAULT */}
              {activePanel === "vault" && (
                connected ? (
                  <div className="card">
                    <h3>Vault</h3>
                    <p>JAL: <strong>{fmt(jal)}</strong> • SOL: <strong>{fmt(sol)}</strong></p>
                    <p style={{ opacity: 0.85 }}>Recent activity and positions will live here.</p>
                  </div>
                ) : (
                  <div className="card">
                    <h3>Vault</h3>
                    <p>Connect to view balances and activity.</p>
                    <ConnectButton className="button gold" />
                  </div>
                )
              )}

              {/* SUPPORT */}
              {activePanel === "support" && (
                <div className="card">
                  <h3>Support</h3>
                  <p>Need help? Use the links below.</p>
                  <div className="chip-row" style={{ marginTop: 10 }}>
                    <a className="chip" href="https://t.me/jalsolcommute" target="_blank" rel="noreferrer">Telegram</a>
                    <a className="chip" href="https://x.com/JAL358" target="_blank" rel="noreferrer">X</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}