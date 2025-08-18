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

import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultAddressSelector,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-adapter-mobile";

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

/* -------- Header -------- */
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
        <NavLink to="/" onClick={closeMenu}>
          <img src="/JALSOL1.gif" alt="JAL/SOL Logo" className="logo header-logo" />
        </NavLink>

        <nav className="main-nav">
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
          {publicKey && <WalletDisconnectButton className="wallet-disconnect-btn" />}
        </nav>

        <div className="social-links">
          <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer">
            <img src="/icons/X.png" alt="X" />
          </a>
          <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer">
            <img src="/icons/Telegram.png" alt="Telegram" />
          </a>
          <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer">
            <img src="/icons/TikTok.png" alt="TikTok" />
          </a>
        </div>

        <button
          className={`hamburger ${menuOpen ? "is-open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
const Header = memo(HeaderView);

/* -------- Sidebar -------- */
function SidebarView({
  open,
  isLanding,
  links,
  closeMenu,
  publicKey,
}: {
  open: boolean;
  isLanding: boolean;
  links: { to: string; label: string }[];
  closeMenu: () => void;
  publicKey: any;
}): ReactElement | null {
  if (!open || isLanding) return null;
  return (
    <>
      <div className="sidebar-overlay" onClick={closeMenu} />
      <div className="sidebar-nav" role="dialog" aria-modal="true">
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

  useEffect(() => setMenuOpen(false), [location.pathname]);

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
      { to: "/jal", label: "JAL" },
      { to: vaultPath, label: vaultLabel },
      { to: "/shop", label: "SHOP" }, // ✅ Added SHOP link
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
// src/App.tsx (only the routes array changed here)
<Routes location={location} key={location.pathname}>
  <Route path="/" element={<Landing />} />
  <Route path="/shop" element={<Landing initialPanel="shop" />} />  {/* 👈 deep-link into panel */}
  <Route path="/home" element={<Home />} />
  <Route path="/crypto-generator" element={<CryptoGenerator />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/vault/:symbol" element={<Vault />} />
  <Route path="/jal" element={<Protected><Jal inHub={false} /></Protected>} />
  <Route path="/about" element={<About />} />
  <Route path="/manifesto" element={<Manifesto />} />
  <Route path="/content" element={<Content />} />
  <Route path="/learn" element={<Learn />} />
  <Route path="/start" element={<Protected><div style={{ padding: 24 }}>Start flow…</div></Protected>} />
  <Route path="/terms" element={<Protected><div style={{ padding: 24 }}>Terms…</div></Protected>} />
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
            url: typeof window !== "undefined" ? window.location.origin : "https://jalsol.com",
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

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={(e) => console.error("Wallet error:", e)}>
        <WalletModalProvider>
          <Router>
            <Shell />
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
