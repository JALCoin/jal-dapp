// src/App.tsx
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  const toggleMenu = () => setMenuOpen((s) => !s);
  const closeMenu = () => setMenuOpen(false);

  const vaultPath = userSymbol ? `/vault/${userSymbol}` : "/dashboard";
  const vaultLabel = userSymbol ? `VAULT / ${userSymbol}` : "VAULT / JAL";

  const disconnectBtnStyles: React.CSSProperties = {
    border: "2px solid var(--jal-text)",
    background: "black",
    color: "var(--jal-text)",
    borderRadius: "10px",
    padding: "0.45rem 0.8rem",
    fontWeight: 700,
    textTransform: "uppercase",
    boxShadow: "0 0 10px var(--jal-glow)",
    cursor: "pointer",
  };

  return (
    <>
      {/* Hide ENTIRE header on Landing */}
      {!isLanding && (
        <header>
          <div className="header-inner">
            <NavLink to="/" onClick={closeMenu}>
              <img
                src="/JALSOL1.gif"
                alt="JALSOL Logo"
                className="logo header-logo"
              />
            </NavLink>

            <nav className="main-nav">
              <NavLink to="/" onClick={closeMenu} className="nav-link">
                JAL/SOL
              </NavLink>
              <NavLink to={vaultPath} onClick={closeMenu} className="nav-link">
                {vaultLabel}
              </NavLink>
              <NavLink to="/learn" onClick={closeMenu} className="nav-link">
                LEARN/SOL
              </NavLink>
              <NavLink to="/about" onClick={closeMenu} className="nav-link">
                About JAL
              </NavLink>

              {publicKey && (
                <WalletDisconnectButton
                  style={disconnectBtnStyles}
                  onClick={() => navigate("/")}
                />
              )}
            </nav>

            <div className="social-links">
              <a
                href="https://x.com/JAL358"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/icons/X.png" alt="X" />
              </a>
              <a
                href="https://t.me/JALSOL"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/icons/Telegram.png" alt="Telegram" />
              </a>
              <a
                href="https://tiktok.com/@jalcoin"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/icons/TikTok.png" alt="TikTok" />
              </a>
            </div>

            <button className="hamburger" onClick={toggleMenu} aria-label="Toggle menu">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </header>
      )}

      {menuOpen && !isLanding && (
        <>
          <div className="sidebar-overlay" onClick={closeMenu} />
          <div className="sidebar-nav">
            <NavLink to="/" onClick={closeMenu} className="nav-link">
              JAL/SOL
            </NavLink>
            <NavLink to={vaultPath} onClick={closeMenu} className="nav-link">
              {vaultLabel}
            </NavLink>
            <NavLink to="/learn" onClick={closeMenu} className="nav-link">
              LEARN/SOL
            </NavLink>
            <NavLink to="/about" onClick={closeMenu} className="nav-link">
              About JAL
            </NavLink>

            {publicKey && (
              <WalletDisconnectButton
                style={{ ...disconnectBtnStyles, marginTop: "0.5rem" }}
                onClick={() => {
                  closeMenu();
                  navigate("/");
                }}
              />
            )}
          </div>
        </>
      )}

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
