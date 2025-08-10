// src/App.tsx
import { useState, useEffect, useMemo, type ReactElement } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  Navigate,
} from "react-router-dom";

/* === Solana Wallet Adapter Providers === */
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  TrustWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
} from "@solana-mobile/wallet-adapter-mobile";
import "@solana/wallet-adapter-react-ui/styles.css";

import { useWallet } from "@solana/wallet-adapter-react";

import Landing from "./pages/Landing";
import Home from "./pages/Home";
import CryptoGenerator from "./pages/CryptoGenerator";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import About from "./pages/About";
import Manifesto from "./pages/Manifesto";
import Learn from "./pages/Learn";
import Content from "./pages/Content";
import Hub from "./pages/Hub";
import Jal from "./pages/Jal";

/* -------- Guard -------- */
function Protected({ children }: { children: ReactElement }) {
  const { connected } = useWallet();
  if (!connected) return <Navigate to="/" replace />;
  return children;
}

/* -------- App Shell (uses wallet context) -------- */
function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);

  const location = useLocation();
  const { publicKey } = useWallet();

  const isLanding = location.pathname === "/";
  const isHub = location.pathname.startsWith("/hub");

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
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

  const links = [
    { to: "/", label: "JAL/SOL" },
    { to: "/hub", label: "HUB" },
    { to: vaultPath, label: vaultLabel },
    { to: "/learn", label: "LEARN/SOL" },
    { to: "/about", label: "About JAL" },
  ];

  const renderNavLink = (to: string, label: string) => (
    <NavLink
      key={`${to}-${label}`}
      to={to}
      onClick={closeMenu}
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
    >
      {label}
    </NavLink>
  );

  return (
    <>
      {/* Hide header on Landing and on Hub overlay (full-bleed). */}
      {!isLanding && !isHub && (
        <header>
          <div className="header-inner">
            <NavLink to="/" onClick={closeMenu} aria-label="Go to Landing">
              <img src="/JALSOL1.gif" alt="JAL/SOL Logo" className="logo header-logo" />
            </NavLink>

            <nav className="main-nav" aria-label="Primary">
              {links.map((l) => renderNavLink(l.to, l.label))}
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
              className="hamburger"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="sidebar-nav"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </header>
      )}

      {/* Sidebar (not on Landing or Hub) */}
      {menuOpen && !isLanding && !isHub && (
        <>
          <div className="sidebar-overlay" onClick={closeMenu} />
          <div id="sidebar-nav" className="sidebar-nav" role="dialog" aria-modal="true">
            {links.map((l) => renderNavLink(l.to, l.label))}
            {publicKey && <WalletDisconnectButton className="wallet-disconnect-btn" />}
          </div>
        </>
      )}

      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Hub as a fixed overlay (guarded) */}
        <Route
          path="/hub"
          element={
            <Protected>
              <Hub />
            </Protected>
          }
        />

        {/* Other routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/crypto-generator" element={<CryptoGenerator />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault/:symbol" element={<Vault />} />
        <Route path="/about" element={<About />} />
        <Route path="/manifesto" element={<Manifesto />} />
        <Route path="/content" element={<Content />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/jal" element={<Protected><Jal /></Protected>} />

        {/* Placeholders (guarded) */}
        <Route
          path="/start"
          element={
            <Protected>
              <div style={{ padding: 24 }}>Start flow…</div>
            </Protected>
          }
        />
        <Route
          path="/utility"
          element={
            <Protected>
              <div style={{ padding: 24 }}>Utility…</div>
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
    </>
  );
}

/* -------- Wallet + Router Providers at Root -------- */
export default function App() {
  // Use your proxy RPC endpoint here if you have one
  const endpoint = useMemo(
    () => process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com",
    []
  );

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new TrustWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolanaMobileWalletAdapter({
        appIdentity: {
          name: "JAL/SOL",
          uri: "https://jalsol.com",
          icon: "https://jalsol.com/icon.png", // optional
        },
        cluster: "mainnet-beta",
        authorizationResultCache: createDefaultAuthorizationResultCache(),
      }),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <Shell />
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
