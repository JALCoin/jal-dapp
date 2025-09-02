// src/App.tsx
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
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
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";

import "@solana/wallet-adapter-react-ui/styles.css";
import Landing from "./pages/Landing";

/* ------------------------------------------------------------------ */
/* Solana Providers                                                    */
/* ------------------------------------------------------------------ */
function SolanaProviders({ children }: PropsWithChildren) {
  const network: WalletAdapterNetwork = WalletAdapterNetwork.Mainnet;
  const cluster: Cluster = "mainnet-beta";

  const endpoint = useMemo(() => {
    const injected = (window as any).__SOLANA_RPC_ENDPOINT__;
    const env = import.meta.env.VITE_SOLANA_RPC as string | undefined;
    return injected ?? env ?? clusterApiUrl(cluster);
  }, [cluster]);

  const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID as
    | string
    | undefined;

  // Good metadata helps mobile WalletConnect UX (shown inside the wallet)
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://www.jalsol.com";
  const wallets = useMemo(() => {
    const base = [
      new PhantomWalletAdapter(), // mobile deep-link + extension
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
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile deep-link return guard                                       */
/* - When a user approves in Phantom and returns to the browser,       */
/*   autoConnect sometimes needs a nudge. We attempt a reconnect on    */
/*   visibility/focus if the wallet is Phantom (or WC Phantom).        */
/* ------------------------------------------------------------------ */
function MobileDeepLinkReturnGuard() {
  const { wallet, connected, connecting, connect } = useWallet();

  useEffect(() => {
    const tryReconnect = () => {
      if (document.visibilityState !== "visible") return;
      // Don’t spam if already connected/connecting or no wallet chosen yet
      if (connected || connecting || !wallet) return;

      const name = wallet.adapter?.name?.toLowerCase() ?? "";
      const looksLikePhantom =
        name.includes("phantom") || name.includes("walletconnect");
      if (looksLikePhantom) {
        // Small delay to let the tab fully resume
        setTimeout(() => {
          connect().catch(() => {
            /* swallow — user may cancel */
          });
        }, 100);
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

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */
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

function HeaderView({
  onMenu,
  isOpen,
}: {
  onMenu: () => void;
  isOpen: boolean;
}) {
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

        <NavLink to="/" aria-label="Home">
          <img className="logo header-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
        </NavLink>

        <button
          className={`hamburger ${isOpen ? "is-open" : ""}`}
          onClick={onMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}

function SidebarView({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <button
        className="sidebar-overlay"
        aria-label="Close menu overlay"
        onClick={onClose}
      />
      <aside className="sidebar-nav" aria-label="Sidebar navigation">
        <nav>
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            Home
          </NavLink>
        </nav>
        <div style={{ marginTop: 8 }} />
        <WalletMultiButton />
        <DisconnectBtn />
      </aside>
    </>
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
    // NOTE: Landing will read ?panel=shop|support
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
      <NavLink
        to={link("support")}
        className={() => (isActive("support") ? "active" : "")}
      >
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

  // lock body when menu is open
  useEffect(() => {
    if (menuOpen) document.body.setAttribute("data-menu-open", "true");
    else document.body.removeAttribute("data-menu-open");
    return () => document.body.removeAttribute("data-menu-open");
  }, [menuOpen]);

  return (
    <SolanaProviders>
      {/* Nudge reconnect after returning from Phantom on mobile */}
      <MobileDeepLinkReturnGuard />

      <BrowserRouter>
        <HeaderView onMenu={() => setMenuOpen((v) => !v)} isOpen={menuOpen} />
        <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main role="main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <TabBar />
      </BrowserRouter>
    </SolanaProviders>
  );
}
