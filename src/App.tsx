// src/App.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  lazy,
  Suspense,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
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

/* ------------------------------- Lazy routes ------------------------------ */
const Shop         = lazy(() => import("./pages/Shop"));                 // single generator
const Sell         = lazy(() => import("./pages/Sell"));                 // creator guide / ops
const Vault        = lazy(() => import("./pages/Vault"));                // YOUR page
// Legacy (kept for compatibility)
const CryptoGeneratorIntro  = lazy(() => import("./pages/CryptoGeneratorIntro"));
const CryptoGenerator       = lazy(() => import("./pages/CryptoGenerator"));

/* --------------------------- Prefetch (core paths) ------------------------- */
let prefetched = false;
function prefetchKeyRoutes() {
  if (prefetched) return;
  prefetched = true;
  import("./pages/Shop").catch(() => {});
  import("./pages/Sell").catch(() => {});
  import("./pages/Vault").catch(() => {});
}

/* --------------------------------- Errors ---------------------------------- */
class AppErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: unknown }
> {
  state = { hasError: false, error: undefined as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <main className="landing-gradient" style={{ padding: 24 }}>
          <div className="container">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Something went wrong</h3>
              <p className="muted">Open the dev console for details.</p>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                {String((this.state.error as any)?.stack ?? this.state.error)}
              </pre>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

/** Reset error boundary on route change */
function RouteAwareBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <AppErrorBoundary key={pathname}>{children}</AppErrorBoundary>;
}

/* -------------------------------- Providers -------------------------------- */
function SolanaProviders({ children }: PropsWithChildren) {
  const network: WalletAdapterNetwork = WalletAdapterNetwork.Mainnet;
  const cluster: Cluster = "mainnet-beta";

  const endpoint = useMemo(() => {
    try {
      const injected = (window as any)?.__SOLANA_RPC_ENDPOINT__ as string | undefined;
      const env = import.meta.env?.VITE_SOLANA_RPC as string | undefined;
      return injected ?? env ?? clusterApiUrl(cluster);
    } catch {
      return clusterApiUrl(cluster);
    }
  }, [cluster]);

  const connectionConfig = useMemo(
    () => ({ commitment: "confirmed" as const, confirmTransactionInitialTimeout: 45_000 }),
    []
  );

  const WC_PROJECT_ID = import.meta.env?.VITE_WC_PROJECT_ID as string | undefined;
  const appUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : "https://www.jalsol.com"),
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

/* --------------------------------- Helpers --------------------------------- */
function MobileDeepLinkReturnGuard() {
  const { wallet, connected, connecting, connect } = useWallet();
  useEffect(() => {
    const tryReconnect = () => {
      if (document.visibilityState !== "visible") return;
      if (connected || connecting || !wallet) return;
      const name = wallet.adapter?.name?.toLowerCase() ?? "";
      if (name.includes("phantom") || name.includes("walletconnect")) {
        setTimeout(() => { connect().catch(() => {}); }, 120);
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

function WalletModalVisibilityGuard() {
  useEffect(() => {
    const body = document.body;
    const set = (v: boolean) =>
      v ? body.setAttribute("data-wallet-visible", "true") : body.removeAttribute("data-wallet-visible");
    const obs = new MutationObserver(() => {
      const modal =
        document.querySelector(".wallet-adapter-modal") ||
        document.querySelector(".wallet-adapter-modal-container");
      set(Boolean(modal));
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); body.removeAttribute("data-wallet-visible"); };
  }, []);
  return null;
}

function ScrollRestorer() {
  const { pathname, search } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [pathname, search]);
  return null;
}

/* ------------------------------ Trust Strip ------------------------------- */
function RpcStatusChip() {
  const { connection } = useConnection();
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [state, setState] = useState<"checking" | "ok" | "warn" | "down">("checking");

  const ping = useCallback(async () => {
    const t0 = performance.now();
    try {
      const res = connection.getEpochInfo();
      await Promise.race([res, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000))]);
      const dt = performance.now() - t0;
      setLatencyMs(Math.round(dt));
      setState(dt < 1200 ? "ok" : "warn");
    } catch {
      setLatencyMs(null);
      setState("down");
    }
  }, [connection]);

  useEffect(() => {
    let id: any;
    ping();
    id = setInterval(ping, 20000);
    return () => clearInterval(id);
  }, [ping]);

  const host = (() => { try { return new URL((connection as any)._rpcEndpoint).host; } catch { return "RPC"; } })();
  const dot = state === "ok" ? "ok" : state === "warn" ? "warn" : "down";
  const label =
    state === "checking" ? "Checking…" :
    state === "ok" ? `Healthy • ${latencyMs}ms` :
    state === "warn" ? `Degraded • ${latencyMs ?? "—"}ms` : "Down";

  return (
    <button className="chip sm" onClick={ping} title="Click to recheck">
      <span className={`dot ${dot}`} style={{ marginRight: 8 }} />
      Mainnet • {host}: {label}
    </button>
  );
}

function TrustStrip() {
  const jal = (JAL_MINT ?? "").toString().trim();
  const hasMint = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(jal);
  const short = hasMint ? `${jal.slice(0,4)}…${jal.slice(-4)}` : "not set";

  const explorerUrl = hasMint
    ? `https://explorer.solana.com/address/${jal}?cluster=mainnet`
    : "https://explorer.solana.com/?cluster=mainnet";
  const raydiumUrl = hasMint
    ? `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(jal)}&fixed=in&utm_source=jalsol&utm_medium=truststrip`
    : `https://raydium.io/swap/?utm_source=jalsol&utm_medium=truststrip`;

  return (
    <div className="trust-strip" aria-label="Trust & quick links">
      <a className={`chip sm mono ${hasMint ? "" : "disabled"}`} href={explorerUrl} target="_blank" rel="noreferrer">
        Mint: {short}
      </a>
      <a className="chip sm" href={explorerUrl} target="_blank" rel="noreferrer">Explorer</a>
      <a className="chip sm" href={raydiumUrl} target="_blank" rel="noreferrer">Swap on Raydium</a>
      <RpcStatusChip />
    </div>
  );
}

/* ----------------------------- Header & Nav ------------------------------ */
function HeaderView({ onMenu, isOpen }: { onMenu: () => void; isOpen: boolean }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="social-links" aria-label="Social Links">
          <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
            <img src="/icons/X.png" alt="" />
          </a>
        </div>
        <NavLink to="/" end aria-label="Home">
          <img className="logo header-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
        </NavLink>
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
    </header>
  );
}

function SidebarView({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const onEnter = () => { prefetchKeyRoutes(); onClose(); };

  return (
    <>
      <button className="sidebar-overlay" aria-label="Close menu overlay" onClick={onClose} />
      <aside className="sidebar-nav" aria-label="Sidebar navigation">
        <nav className="sidebar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
            Home
          </NavLink>
          <NavLink to="/vault" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onEnter}>
            Vault
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onEnter}>
            Generator
          </NavLink>
          <NavLink to="/sell" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onEnter}>
            Creator Guide
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
    <button type="button" className="wallet-disconnect-btn" onClick={() => disconnect().catch(() => {})}>
      Disconnect
    </button>
  );
}

/* --------------------------------- Pages ---------------------------------- */
function PageStub({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="landing-gradient">
      <div className="container" style={{ padding: 24 }}>
        <div className="card">
          <h1 className="jal-title" style={{ marginTop: 0 }}>{title}</h1>
          {children ?? <p className="muted" style={{ marginTop: 6 }}>Coming soon.</p>}
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------- App ----------------------------------- */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Prefetch core routes for snappy first interaction
  useEffect(() => { prefetchKeyRoutes(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
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
        <HeaderView onMenu={() => setMenuOpen((v) => !v)} isOpen={menuOpen} />
        <TrustStrip />
        <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />
        <RouteAwareBoundary>
          <main role="main">
            <Suspense
              fallback={
                <div className="container" style={{ padding: 24 }}>
                  <div className="card">Loading…</div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/vault" element={<Vault />} />          {/* Your personal hub */}
                <Route path="/shop" element={<Shop />} />            {/* Single generator */}
                <Route path="/sell" element={<Sell />} />            {/* Creator guide */}
                {/* Legacy routes kept for compatibility */}
                <Route path="/crypto-generator" element={<CryptoGeneratorIntro />} />
                <Route path="/crypto-generator/engine" element={<CryptoGenerator />} />
                {/* Optional pages */}
                <Route path="/about" element={<PageStub title="About" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </RouteAwareBoundary>
      </BrowserRouter>
    </SolanaProviders>
  );
}
