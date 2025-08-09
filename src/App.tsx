// src/App.tsx
import { useState, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
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

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { publicKey } = useWallet();

  const isLanding = location.pathname === "/";

  // Load cached vault symbol
  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  // Lock page scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // On wallet disconnect -> navigate to Landing (prevents bounce)
  useEffect(() => {
    if (!publicKey && location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [publicKey, location.pathname, navigate]);

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

  // Define links once; reuse in header + sidebar
  const links = [
    { to: "/", label: "JAL/SOL" },
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
      {/* Header hidden on Landing */}
      {!isLanding && (
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
              <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <img src="/icons/Telegram.png" alt="" />
              </a>
              <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
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

      {/* Sidebar (mobile) */}
      {menuOpen && !isLanding && (
        <>
          <div className="sidebar-overlay" onClick={closeMenu} />
          <div id="sidebar-nav" className="sidebar-nav" role="dialog" aria-modal="true">
            {links.map((l) => renderNavLink(l.to, l.label))}
            {publicKey && <WalletDisconnectButton className="wallet-disconnect-btn" />}
          </div>
        </>
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/crypto-generator" element={<CryptoGenerator />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault/:symbol" element={<Vault />} />
        <Route path="/about" element={<About />} />
        <Route path="/manifesto" element={<Manifesto />} />
        <Route path="/content" element={<Content />} />
        <Route path="/learn" element={<Learn />} />
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
