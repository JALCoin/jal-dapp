// src/App.tsx
import React, {
  useEffect,
  useMemo,
  useState,
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

// Lazy pages
const CryptoGeneratorIntro = lazy(() => import("./pages/CryptoGeneratorIntro"));
const CryptoGenerator = lazy(() => import("./pages/CryptoGenerator"));
const Sell = lazy(() => import("./pages/Sell"));

/* --------------------------- Prefetch (Generators) --------------------------- */
let generatorsPrefetched = false;
function prefetchGenerators() {
  if (generatorsPrefetched) return;
  generatorsPrefetched = true;
  import("./pages/CryptoGeneratorIntro");
  import("./pages/CryptoGenerator");
}

/* --------------------------------- Errors ---------------------------------- */
class AppErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: unknown }
> {
  state = { hasError: false as const, error: undefined as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
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
  return (
    <>
      <button className="sidebar-overlay" aria-label="Close menu overlay" onClick={onClose} />
      <aside className="sidebar-nav" aria-label="Sidebar navigation">
        <nav>
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
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
          <NavLink to="/sell" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
            Sell Space
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
        <AppErrorBoundary>
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
                <Route path="/sell" element={<Sell />} />
                <Route path="/crypto-generator" element={<CryptoGeneratorIntro />} />
                <Route path="/crypto-generator/engine" element={<CryptoGenerator />} />
                {/* You can add more simple pages later like About, etc. */}
                <Route path="/about" element={<PageStub title="About" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </AppErrorBoundary>
      </BrowserRouter>
    </SolanaProviders>
  );
}
