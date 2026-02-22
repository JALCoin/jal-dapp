import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Jal = lazy(() => import("./Jal"));

/**
 * NEW LANDING FLOW
 * 1) Blank screen with centered logo
 * 2) Clicking logo opens a NAV overlay (Home / About JAL / Shop)
 * 3) Home shows: summary + embedded $JAL~Engine window + packaged software section (placeholders for now)
 *
 * Notes:
 * - Balances removed (per your instruction).
 * - Wallet connect is available but not forced.
 * - Uses CSS classes only (index.css controls layout).
 */

type Panel = "none" | "nav" | "home" | "jal" | "shop";
type LandingProps = { initialPanel?: Panel };

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

/* ---------- NAV Overlay (full-width curved buttons) ---------- */
function NavOverlay({
  onSelect,
  onClose,
}: {
  onSelect: (panel: Panel) => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        className="nav-overlay-backdrop"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <section className="nav-overlay" role="dialog" aria-modal="true" aria-label="Navigation">
        <div className="nav-overlay-inner">
          <button className="nav-big" onClick={() => onSelect("home")}>HOME</button>
          <button className="nav-big" onClick={() => onSelect("jal")}>ABOUT JAL</button>
          <button className="nav-big" onClick={() => onSelect("shop")}>SHOP</button>

          <button className="nav-close" onClick={onClose} aria-label="Close navigation">
            Close
          </button>
        </div>
      </section>
    </>
  );
}

/* ---------- Home Page Content (inside Landing) ---------- */
function HomeContent() {
  return (
    <div className="home-wrap">
      {/* Top summary section */}
      <section className="home-summary card">
        <h2 className="home-title">jalsol.com</h2>

        <p className="home-lead">
          Founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical Metal Engineer • Digital Creator.
          A minimalistic application linked to the Solana blockchain.
        </p>

        <p className="home-lead">
          $JAL operates within the <strong>JAL/SOL</strong> liquidity pool on Raydium and can be verified on Solscan.
        </p>

        <div className="home-links">
          <a className="chip" href="https://raydium.io/" target="_blank" rel="noreferrer">Raydium (JAL/SOL)</a>
          <a className="chip" href="https://solscan.io/" target="_blank" rel="noreferrer">Solscan ($JAL)</a>
        </div>
      </section>

      {/* Embedded Engine Window */}
      <section className="engine-window card">
        <div className="engine-head">
          <h3 className="engine-title">$JAL~Engine</h3>
          <div className="engine-sub">Jeroid deployment • CEX executor • logs</div>
        </div>

        <div className="engine-controls">
          <button className="button gold" type="button">Start</button>
          <button className="button" type="button">Stop</button>
          <button className="button ghost" type="button">Settings</button>
          <button className="button ghost" type="button">View Logs</button>
        </div>

        <div className="engine-log" aria-label="Engine log output">
          <pre>
{`[engine] idle
[executor] not connected
[deploy] awaiting configuration`}
          </pre>
        </div>
      </section>

      {/* Packaged product section */}
      <section className="engine-package card gold">
        <h3>Engine Package</h3>
        <p>
          A packaged version of the engine + deployment system for anyone who wants to create their own iteration of the
          trading system inside jalsol.com.
        </p>

        <div className="engine-package-actions">
          <button className="button gold" type="button">View Package</button>
          <button className="button" type="button">Purchase</button>
        </div>
      </section>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Landing({ initialPanel = "none" }: LandingProps) {
  const navigate = useNavigate();
  const { connected, connecting, wallet, select, connect } = useWallet();
  const { setVisible } = useWalletModal();

  const [panel, setPanel] = useState<Panel>(initialPanel);

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

  /* ---------- Overlay lock ---------- */
  const navOpen = panel === "nav";
  useEffect(() => {
    if (navOpen) document.body.setAttribute("data-nav-open", "true");
    else document.body.removeAttribute("data-nav-open");
    return () => document.body.removeAttribute("data-nav-open");
  }, [navOpen]);

  /* ---------- ESC closes NAV ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && navOpen) setPanel("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  /* ---------- Click logo on blank landing ---------- */
  const enter = () => setPanel("nav");

  /* ---------- Select nav option ---------- */
  const onNavSelect = (next: Panel) => {
    setPanel(next);

    // Optional: route hooks if you want separate pages later
    if (next === "home") navigate("/", { replace: true });
    if (next === "jal") navigate("/about", { replace: true });
    if (next === "shop") navigate("/shop", { replace: true });
  };

  /* ---------- Content selection ---------- */
  const content = useMemo(() => {
    if (panel === "home") return <HomeContent />;

    if (panel === "jal") {
      return (
        <div className="home-wrap">
          <section className="card">
            <h2>About JAL</h2>
            <p>
              $JAL is accessible on Raydium and verifiable on Solscan. This application exists as a minimal interface
              connected to the Solana blockchain.
            </p>

            {!connected && (
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="button gold" type="button" onClick={() => setVisible(true)}>Connect Wallet</button>
              </div>
            )}

            {connected && (
              <div style={{ marginTop: 12 }}>
                <Suspense fallback={<div>Loading…</div>}>
                  <Jal inHub />
                </Suspense>
              </div>
            )}
          </section>
        </div>
      );
    }

    if (panel === "shop") {
      return (
        <div className="home-wrap">
          <section className="card">
            <h2>Shop</h2>
            <p>
              Sole trader activity: design and creation of physical and digital products to sell online.
              jalsol.com is the hub for that.
            </p>
            <div className="home-links" style={{ marginTop: 10 }}>
              <a className="chip" href="https://jalrelics.etsy.com" target="_blank" rel="noreferrer">Etsy Shop</a>
              <a className="chip" href="https://jalsol.com" target="_blank" rel="noreferrer">jalsol.com</a>
            </div>
          </section>
        </div>
      );
    }

    return null;
  }, [panel, connected, setVisible]);

  return (
    <main className="landing-blank" aria-label="JAL/SOL Landing">
      {/* ===== BLANK SCREEN LANDING (logo centered) ===== */}
      {panel === "none" && (
        <button className="center-logo-btn" onClick={enter} aria-label="Enter jalsol.com">
          <img className="center-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
          <div className="center-logo-hint">ENTER</div>
        </button>
      )}

      {/* ===== NAV OVERLAY ===== */}
      {navOpen && (
        <NavOverlay
          onSelect={onNavSelect}
          onClose={() => setPanel("none")}
        />
      )}

      {/* ===== PAGE CONTENT (HOME / ABOUT JAL / SHOP) ===== */}
      {panel !== "none" && panel !== "nav" && (
        <section className="home-shell">
          <div className="home-shell-top">
            {/* Wallet controls available on pages */}
            <div className="home-wallet">
              {connected ? (
                <DisconnectButton className="wallet-disconnect-btn" />
              ) : (
                <ConnectButton className="wallet-disconnect-btn" />
              )}
            </div>

            {/* Quick open nav */}
            <button className="home-open-nav" type="button" onClick={() => setPanel("nav")}>
              Menu
            </button>
          </div>

          {content}
        </section>
      )}
    </main>
  );
}