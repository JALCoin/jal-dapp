// src/App.tsx
import { useState, useEffect, useMemo, memo, type ReactElement } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  Navigate,
} from "react-router-dom";

import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
  import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import "@solana/wallet-adapter-react-ui/styles.css";

/* Mobile deep-link handoff */
import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultAddressSelector,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-adapter-mobile";

/* Optional page transitions container */
import { AnimatePresence } from "framer-motion";

/* Pages */
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import CryptoGenerator from "./pages/CryptoGenerator";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import About from "./pages/About";
import Manifesto from "./pages/Manifesto";
import Learn from "./pages/Learn";
import Content from "./pages/Content";
import Jal from "./pages/Jal";

/* -------- Guard -------- */
function Protected({ children }: { children: ReactElement }) {
  const { connected } = useWallet();
  return connected ? children : <Navigate to="/" replace />;
}

/* -------- Header (define, then memoize) -------- */
type HeaderProps = {
  isLanding: boolean;
  links: { to: string; label: string }[];
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  publicKey: any;
};

function HeaderView({
  isLanding,
  links,
  menuOpen,
  toggleMenu,
  closeMenu,
  publicKey,
}: HeaderProps): ReactElement | null {
  if (isLanding) return null;

  return (
    <header style={{ position: "relative", zIndex: 90 }}>
      <div className="header-inner">
        <NavLink to="/" onClick={closeMenu} aria-label="Go to Landing">
          <img src="/JALSOL1.gif" alt="JAL/SOL Logo" className="logo header-logo" />
        </NavLink>

        <nav className="main-nav" aria-label="Primary">
          {/* Normal route links */}
          {links.map(({ to, label }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {label}
            </NavLink>
          ))}

          {/* Hub now lives on Landing as an in-page panel */}
          <a className="nav-link" href="/#hub" onClick={closeMenu}>
            HUB
          </a>

          {publicKey && <WalletDisconnectButton className="wallet-disconnect-btn" />}
        </nav>

        <div className="social-links" aria-label="Social links">
          <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
            <img src="/icons/X.png" alt="" />
          </a>
          <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
            <img src="/icons/Telegram.png" alt="" />
          </a>
          <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <img src="/icons/TikTok.png" alt="" />
          </a>
        </div>

        <button
          className={`hamburger ${menuOpen ? "is-open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar-nav"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
const Header = memo(HeaderView);

/* -------- Sidebar (define, then memoize) -------- */
type SidebarProps = {
  open: boolean;
  isLanding: boolean;
  links: { to: string; label: string }[];
  closeMenu: () => void;
  publicKey: any;
};

function SidebarView({
  open,
  isLanding,
  links,
  closeMenu,
  publicKey,
}: SidebarProps): ReactElement | null {
  if (!open || isLanding) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={closeMenu} />
      <div id="sidebar-nav" className="sidebar-nav" role="dialog" aria-modal="true">
        {links.map(({ to, label }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            onClick={closeMenu}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            {label}
          </NavLink>
        ))}
        {/* Hub hash link inside sidebar */}
        <a className="nav-link" href="/#hub" onClick={closeMenu}>
          HUB
        </a>

        {publicKey && <WalletDisconnectButton className="wallet-disconnect-btn" />}
      </div>
    </>
  );
}
const Sidebar = memo(SidebarView);

/* -------- App Shell -------- */
function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);
  const { publicKey } = useWallet();
  const location = useLocation();

  const isLanding = location.pathname === "/";

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock scroll only when sidebar is open
  useEffect(() => {
    const root = document.documentElement;
    if (menuOpen) {
      root.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      root.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      root.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((s) => !s);
  const closeMenu = () => setMenuOpen(false);

  const vaultPath = useMemo(
    () => (userSymbol ? `/vault/${encodeURIComponent(userSymbol)}` : "/dashboard"),
    [userSymbol]
  );
  const vaultLabel = useMemo(
    () => (userSymbol ? `VAULT / ${userSymbol}` : "VAULT / JAL"),
    [userSymbol]
  );

  const links = useMemo(
    () => [
      { to: "/", label: "JAL/SOL" },
      // HUB removed from router; shown as hash link in the header/sidebar
      { to: vaultPath, label: vaultLabel },
      { to: "/learn", label: "LEARN/SOL" },
      { to: "/about", label: "About JAL" },
    ],
    [vaultLabel, vaultPath]
  );

  return (
    <>
      <Header
        isLanding={isLanding}
        links={links}
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        closeMenu={closeMenu}
        publicKey={publicKey}
      />

      <Sidebar
        open={menuOpen}
        isLanding={isLanding}
        links={links}
        closeMenu={closeMenu}
        publicKey={publicKey}
      />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Landing now includes the Hub panel inline */}
          <Route path="/" element={<Landing />} />

          {/* Standalone/legacy pages */}
          <Route path="/home" element={<Home />} />
          <Route path="/crypto-generator" element={<CryptoGenerator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault/:symbol" element={<Vault />} />
          <Route path="/about" element={<About />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/content" element={<Content />} />
          <Route path="/learn" element={<Learn />} />

          {/* JAL is a normal page now (no inHub prop) */}
          <Route path="/jal" element={<Jal />} />

          {/* Misc protected placeholders */}
          <Route
            path="/start"
            element={
              <Protected>
                <div style={{ padding: 24 }}>Start flow…</div>
              </Protected>
            }
          />
          <Route
            path="/terms"
            element={
              <Protected>
                <div style={{ padding: 24 }}>Terms…</div>
              </Protected>
            }
          />

          {/* catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

/* -------- Root Providers -------- */
export default function App() {
  const endpoint = useMemo(() => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      return "http://localhost:3001/api/solana";
    }
    return "https://solana-proxy-production.up.railway.app";
  }, []);

  const network =
    (import.meta as any).env?.VITE_SOLANA_NETWORK === "devnet"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new WalletConnectWalletAdapter({
        network,
        options: {
          projectId: "1bb9e8b5e5b18eafdd0cef6047b67773",
          relayUrl: "wss://relay.walletconnect.com",
          metadata: {
            name: "JAL/SOL Dapp",
            description: "Swap SOL→JAL and use utilities",
            url:
              typeof window !== "undefined"
                ? window.location.origin
                : "https://jalsol.com",
            icons: ["https://jalsol.com/icons/icon-512.png"],
          },
        },
      }),
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: { name: "JAL/SOL", uri: "https://jalsol.com", icon: "/icons/icon-512.png" },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: "mainnet-beta",
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
    ],
    [network]
  );

  const onError = (e: any) => console.error("Wallet error:", e);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          <Router>
            <Shell />
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
