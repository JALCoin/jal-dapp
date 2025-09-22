// src/App.tsx
import {
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
  type PropsWithChildren,
  useCallback,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { clusterApiUrl, type Cluster } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork, type WalletAdapter } from "@solana/wallet-adapter-base";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";

import "@solana/wallet-adapter-react-ui/styles.css";

import Landing from "./pages/Landing";
import { JAL_MINT } from "./config/tokens";

const CryptoGeneratorIntro = lazy(() => import("./pages/CryptoGeneratorIntro"));
const CryptoGenerator = lazy(() => import("./pages/CryptoGenerator"));

/* ------------------------------------------------------------------ */
/* Route prefetch on intent                                            */
/* ------------------------------------------------------------------ */
let generatorsPrefetched = false;
function prefetchGenerators() {
  if (generatorsPrefetched) return;
  generatorsPrefetched = true;
  import("./pages/CryptoGeneratorIntro");
  import("./pages/CryptoGenerator");
}

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */
function SolanaProviders({ children }: PropsWithChildren) {
  const network: WalletAdapterNetwork = WalletAdapterNetwork.Mainnet;
  const cluster: Cluster = "mainnet-beta";

  const endpoint = useMemo(() => {
    const injected = (window as any).__SOLANA_RPC_ENDPOINT__ as string | undefined;
    const env = import.meta.env.VITE_SOLANA_RPC as string | undefined;
    return injected ?? env ?? clusterApiUrl(cluster);
  }, [cluster]);

  const connectionConfig = useMemo(
    () => ({
      commitment: "confirmed" as const,
      confirmTransactionInitialTimeout: 45_000,
    }),
    []
  );

  const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID as string | undefined;

  const appUrl = useMemo(
    () =>
      typeof window !== "undefined" ? window.location.origin : "https://www.jalsol.com",
    []
  );

  const wallets = useMemo<WalletAdapter[]>(() => {
    const base: WalletAdapter[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new GlowWalletAdapter(),
      new BackpackWalletAdapter(),
      new LedgerWalletAdapter(),
    ];
    if (WC_PROJECT_ID) {
      base.push(
        new WalletConnectWalletAdapter({
          network,
          options: {
            projectId: WC_PROJECT_ID,
            relayUrl: "wss://relay.walletconnect.com",
            metadata: {
              name: "JAL/SOL",
              description: "JAL/SOL dApp",
              url: appUrl,
              icons: [`${appUrl}/icon.png`],
            },
          },
        })
      );
    }
    return base;
  }, [network, WC_PROJECT_ID, appUrl]);

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
function MobileDeepLinkReturnGuard() {
  const { wallet, connected, connecting, connect } = useWallet();

  useEffect(() => {
    const tryReconnect = () => {
      if (document.visibilityState !== "visible") return;
      if (connected || connecting || !wallet) return;

      const name = wallet.adapter?.name?.toLowerCase() ?? "";
      if (name.includes("phantom") || name.includes("walletconnect")) {
        setTimeout(() => {
          connect().catch(() => {});
        }, 120);
      }
    };

    document.addEventListener("visibilitychange", tryReconnect);
    window.addEventListener("focus", tryReconnect);
    return () => {
      document.removeEventListener("visibilitychange", tryReconnect);
      window.removeEventListener("focus", tryReconnect);
    };
  }, [wallet, connected, connecting, connect]);

  return null;
}

/** Toggle body[data-wallet-visible] when the wallet modal mounts */
function WalletModalVisibilityGuard() {
  useEffect(() => {
    const body = document.body;
    const set = (v: boolean) =>
      v ? body.setAttribute("data-wallet-visible", "true") : body.removeAttribute("data-wallet-visible");

    const obs = new MutationObserver(() => {
      const modal = document.querySelector(".wallet-adapter-modal");
      set(Boolean(modal));
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      body.removeAttribute("data-wallet-visible");
    };
  }, []);
  return null;
}

/** Scroll to top on route change for nicer navigation on mobile */
function ScrollRestorer() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
}

/** Query param helper for `panel` (supports: hub | shop | support | none) */
function usePanelParam() {
  const loc = useLocation();
  const nav = useNavigate();

  const panel = useMemo(() => {
    const p = new URLSearchParams(loc.search).get("panel");
    return (p ?? "none") as "hub" | "shop" | "support" | "none";
  }, [loc.search]);

  const setPanel = useCallback(
    (next: "hub" | "shop" | "support" | "none") => {
      const qs = new URLSearchParams(loc.search);
      if (next === "none") qs.delete("panel");
      else qs.set("panel", next);
      nav({ pathname: loc.pathname, search: qs.toString() }, { replace: false });
    },
    [loc.pathname, loc.search, nav]
  );

  const openHub = useCallback(() => setPanel("hub"), [setPanel]);
  const closeHub = useCallback(() => setPanel("none"), [setPanel]);

  // reflect body attribute for scroll lock
  useEffect(() => {
    const body = document.body;
    if (panel === "hub") body.setAttribute("data-hub-open", "true");
    else body.removeAttribute("data-hub-open");
    return () => body.removeAttribute("data-hub-open");
  }, [panel]);

  return { panel, setPanel, openHub, closeHub };
}

/* ------------------------------------------------------------------ */
/* Trust strip (under header)                                          */
/* ------------------------------------------------------------------ */
function RpcStatusChip() {
  const { connection } = useConnection();
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [state, setState] = useState<"checking" | "ok" | "warn" | "down">("checking");

  useEffect(() => {
    let mounted = true;

    const withTimeout = <T,>(p: Promise<T>, ms: number) =>
      new Promise<T>((resolve, reject) => {
        const id = setTimeout(() => reject(new Error("timeout")), ms);
        p.then((v) => { clearTimeout(id); resolve(v); })
         .catch((e) => { clearTimeout(id); reject(e); });
      });

    const check = async () => {
      const t0 = performance.now();
      try {
        await withTimeout(connection.getEpochInfo(), 3000);
        const dt = performance.now() - t0;
        if (!mounted) return;
        setLatencyMs(Math.round(dt));
        setState(dt < 1200 ? "ok" : "warn");
      } catch {
        if (!mounted) return;
        setLatencyMs(null);
        setState("down");
      }
    };

    check();
    const id = setInterval(check, 20000);
    return () => { mounted = false; clearInterval(id); };
  }, [connection]);

  const label =
    state === "checking" ? "Checking…" :
    state === "ok"       ? `Healthy${latencyMs != null ? ` • ${latencyMs}ms` : ""}` :
    state === "warn"     ? `Degraded${latencyMs != null ? ` • ${latencyMs}ms` : ""}` :
                           "Down";

  const dotClass = state === "ok" ? "ok" : state === "warn" ? "warn" : "down";

  return (
    <span className="chip sm">
      <span className={`dot ${dotClass}`} style={{ marginRight: 8 }} />
      Mainnet • RPC: {label}
    </span>
  );
}

function TrustStrip() {
  const jal = JAL_MINT;
  const explorerUrl = `https://explorer.solana.com/address/${jal}`;
  const raydiumUrl  = `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${jal}`;
  const short = `${jal.slice(0,4)}…${jal.slice(-4)}`;

  return (
    <div className="trust-strip" aria-label="Trust & quick links">
      <a className="chip sm mono" href={explorerUrl} target="_blank" rel="noreferrer" title="View JAL mint on Solana Explorer">
        Mint: {short}
      </a>
      <a className="chip sm" href={explorerUrl} target="_blank" rel="noreferrer">
        Explorer
      </a>
      <a className="chip sm" href={raydiumUrl} target="_blank" rel="noreferrer">
        Swap on Raydium
      </a>
      <RpcStatusChip />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
function HeaderView({ onMenu, isOpen, onHub }: { onMenu: () => void; isOpen: boolean; onHub: () => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="social-links" aria-label="Social Links">
          <a
            href="https://x.com/JAL358"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
          >
            <img src="/icons/X.png" alt="" />
          </a>
        </div>

        <NavLink to="/" end aria-label="Home">
          <img className="logo header-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
        </NavLink>

        {/* Right side: menu + quick hub */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="hamburger"
            onClick={onHub}
            aria-label="Open Hub"
            title="Open Hub"
            style={{ marginRight: 8 }}
          >
            <span style={{ opacity: 0, width: 0 }} />
            <span style={{ width: 22, height: 2, background: "#fff", display: "block", borderRadius: 2 }} />
            <span style={{ opacity: 0, width: 0 }} />
          </button>
          <button
            className={`hamburger ${isOpen ? "is-open" : ""}`}
            onClick={onMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-haspopup="true"
            aria-expanded={isOpen}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}

function SidebarView({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      <button className="sidebar-overlay" aria-label="Close menu overlay" onClick={onClose} />
      <aside className="sidebar-nav" aria-label="Sidebar navigation">
        <nav>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            Home
          </NavLink>
          <NavLink
            to="/crypto-generator"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onMouseEnter={prefetchGenerators}
            onFocus={prefetchGenerators}
            onClick={onClose}
          >
            Generator
          </NavLink>
        </nav>
        <div style={{ marginTop: 8 }} />
        <WalletMultiButton />
        <DisconnectBtn />
      </aside>
    </>
  );
}

function DisconnectBtn() {
  const { connected, disconnect } = useWallet();
  if (!connected) return null;
  return (
    <button
      className="wallet-disconnect-btn"
      onClick={() => disconnect().catch(() => {})}
    >
      Disconnect
    </button>
  );
}

/* Bottom tab bar (STORE + SUPPORT) */
function TabBar() {
  const location = useLocation();
  const base = location.pathname || "/";
  const link = (panel?: string) => {
    const p = new URLSearchParams(location.search);
    if (!panel) p.delete("panel");
    else p.set("panel", panel);
    const q = p.toString();
    return q ? `${base}?${q}` : base;
  };
  const isActive = (panel?: string) => {
    const p = new URLSearchParams(location.search).get("panel");
    if (!panel) return !p || p === "none";
    return p === panel;
  };

  return (
    <nav className="tabbar" aria-label="App tabs">
      <NavLink to={link("shop")} className={() => (isActive("shop") ? "active" : "")}>
        <div className="tab-icon">🏬</div> STORE
      </NavLink>
      <NavLink to={link("support")} className={() => (isActive("support") ? "active" : "")}>
        <div className="tab-icon">👤</div> SUPPORT
      </NavLink>
    </nav>
  );
}

/* Bottom-center info nav (About / Manifesto / Content / Learn) */
function BottomInfoNav() {
  return (
    <footer className="bottom-nav glass" aria-label="Info navigation">
      <NavLink to="/about">About</NavLink>
      <NavLink to="/manifesto">Manifesto</NavLink>
      <NavLink to="/content">Content</NavLink>
      <NavLink to="/learn">Learn</NavLink>
    </footer>
  );
}

/* Optional: Landing background (TradingView / GIF / Video) */
function BackgroundLayers() {
  const { pathname } = useLocation();
  const onLanding = pathname === "/";

  if (!onLanding) return null;
  return (
    <>
      {/* Mount your TradingView (or any) background in this iframe. */}
      <div className="tv-bg" aria-hidden="true">
        {/* Example placeholder — replace src with your TV lightweight widget HTML, or a hosted page that draws the chart. */}
        <iframe
          title="JAL/SOL Background Chart"
          src="/tv-bg.html"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="bg-scrim" aria-hidden="true" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hub Overlay (portal-like, but simple div in DOM)                    */
/* ------------------------------------------------------------------ */
function HubOverlay() {
  const { panel, closeHub } = usePanelParam();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeHub();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeHub]);

  if (panel !== "hub") return null;

  return (
    <>
      <button className="hub-overlay" aria-label="Close hub overlay" onClick={closeHub} />
      <div
        className="hub-panel--overlay"
        role="dialog"
        aria-modal="true"
        aria-label="JAL/SOL Hub"
        onClick={(e) => {
          // Click outside sheet closes
          if (e.target === e.currentTarget) closeHub();
        }}
      >
        <div className="hub-sheet">
          <div className="hub-panel-top">
            <h3 className="hub-title">Hub</h3>
            <div className="chip-row">
              <NavLink className="chip" to="/crypto-generator" onMouseEnter={prefetchGenerators}>
                Create Token
              </NavLink>
              <NavLink className="chip" to="/crypto-generator/engine" onMouseEnter={prefetchGenerators}>
                Generator Engine
              </NavLink>
              <button className="chip" onClick={closeHub}>Close</button>
            </div>
          </div>

          <div className="hub-panel-body">
            {/* Mount your real Hub content here */}
            <div className="hub-content">
              <div className="card">
                <h4 style={{ margin: 0 }}>Welcome to the Hub</h4>
                <p className="muted" style={{ marginTop: 6 }}>
                  Quick access to Generator, Vault, and swap tools. Replace this block with your real Hub component.
                </p>
                <div className="chip-row">
                  <NavLink className="button" to="/crypto-generator" onMouseEnter={prefetchGenerators}>
                    Start Generator
                  </NavLink>
                  <NavLink className="button" to="/crypto-generator/engine" onMouseEnter={prefetchGenerators}>
                    Open Engine
                  </NavLink>
                </div>
              </div>
              {/* You can add preview tiles or embed the Raydium swap here */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* App Root                                                            */
/* ------------------------------------------------------------------ */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openHub } = usePanelParam(); // for header quick-open

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.setAttribute("data-menu-open", "true");
    else document.body.removeAttribute("data-menu-open");
    return () => document.body.removeAttribute("data-menu-open");
  }, [menuOpen]);

  return (
    <SolanaProviders>
      <MobileDeepLinkReturnGuard />
      <WalletModalVisibilityGuard />
      <BrowserRouter>
        <ScrollRestorer />

        {/* Background layers only on Landing */}
        <BackgroundLayers />

        <HeaderView onMenu={() => setMenuOpen((v) => !v)} isOpen={menuOpen} onHub={openHub} />
        <TrustStrip />
        <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />

        <main role="main">
          <Suspense fallback={<div className="card">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/crypto-generator" element={<CryptoGeneratorIntro />} />
              <Route path="/crypto-generator/engine" element={<CryptoGenerator />} />
              {/* You can add stubs for About/Manifesto/Content/Learn */}
              <Route path="/about" element={<div className="card">About (stub)</div>} />
              <Route path="/manifesto" element={<div className="card">Manifesto (stub)</div>} />
              <Route path="/content" element={<div className="card">Content (stub)</div>} />
              <Route path="/learn" element={<div className="card">Learn (stub)</div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* Overlays */}
        <HubOverlay />

        {/* Bottom navigations */}
        <BottomInfoNav />
        <TabBar />
      </BrowserRouter>
    </SolanaProviders>
  );
}
