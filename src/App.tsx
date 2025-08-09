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
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

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

function Protected({ children }: { children: ReactElement }) {
  const { connected } = useWallet();
  if (!connected) return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);

  const location = useLocation();
  const { publicKey } = useWallet(); // connected not needed here

  const isLanding = location.pathname === "/";
  const isHub = location.pathname.startsWith("/hub");

  // Load cached symbol once
  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  // Lock body scroll when sidebar opened
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
      {/* Hide header on Landing. On /hub keep only logo + socials (no nav/hamburger). */}
      {!isLanding && (
        <header>
          <div className="header-inner">
            <NavLink to="/" onClick={closeMenu} aria-label="Go to Landing">
              <img src="/JALSOL1.gif" alt="JAL/SOL Logo" className="logo header-logo" />
            </NavLink>

            {!isHub && (
              <nav className="main-nav" aria-label="Primary">
                {links.map((l) => renderNavLink(l.to, l.label))}
                {publicKey && <WalletDisconnectButton className="wallet-disconnect-btn" />}
              </nav>
            )}

            <div className="social-links" aria-label="Social links">
              <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
                <img src="/icons/X.png" alt="" />
              </a>
              <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <img src="/icons/Telegram.png" alt="" />
              </a>
              <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <img src="/icons/TikTok.png" alt="" />
              </a>
            </div>

            {!isHub && (
              <button
                className="hamburger"
                onClick={toggleMenu}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                aria-controls="sidebar-nav"
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            )}
          </div>
        </header>
      )}

      {/* Sidebar (never on /hub) */}
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

        {/* Post-connect hub (guarded) */}
        <Route
          path="/hub"
          element={
            <Protected>
              <Hub />
            </Protected>
          }
        />

        {/* The rest of your routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/crypto-generator" element={<CryptoGenerator />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault/:symbol" element={<Vault />} />
        <Route path="/about" element={<About />} />
        <Route path="/manifesto" element={<Manifesto />} />
        <Route path="/content" element={<Content />} />
        <Route path="/learn" element={<Learn />} />

        {/* Placeholders — also guarded since they’re hub actions */}
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

export default function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}
