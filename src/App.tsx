// src/App.tsx
import {
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
  type PropsWithChildren,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";

import { clusterApiUrl, type Cluster, Commitment } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
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
      commitment: "confirmed" as Commitment,
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
        setTimeout(() => void connect().catch(() => {}), 120);
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

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
function HeaderView({ onMenu, isOpen }: { onMenu: () => void; isOpen: boolean }) {
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

/* ------------------------------------------------------------------ */
/* App Root                                                            */
/* ------------------------------------------------------------------ */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  // ESC closes menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when menu is open
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
        <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main role="main">
          <Suspense fallback={<div className="card">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/crypto-generator" element={<CryptoGeneratorIntro />} />
              <Route path="/crypto-generator/engine" element={<CryptoGenerator />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <TabBar />
      </BrowserRouter>
    </SolanaProviders>
  );
}
