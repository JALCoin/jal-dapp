// src/App.tsx
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import CryptoGenerator from "./pages/CryptoGenerator";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import About from "./pages/About";
import Manifesto from "./pages/Manifesto";
import Learn from "./pages/Learn";
import Content from "./pages/Content";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);

  const vaultPath = userSymbol ? `/vault/${userSymbol}` : "/dashboard";
  const vaultLabel = userSymbol ? `VAULT / ${userSymbol}` : "VAULT / JAL";

  // 👇 hide nav on the landing page only
  const showNav = location.pathname !== "/";

  return (
    <header>
      <div className="header-inner">
        <NavLink to="/" onClick={closeMenu}>
          <img src="/logo-glow-gold.svg" alt="JALSOL Logo" className="logo header-logo" />
        </NavLink>

        {showNav && (
          <nav className="main-nav">
            <NavLink to="/" onClick={closeMenu} className="nav-link">JAL/SOL</NavLink>
            <NavLink to={vaultPath} onClick={closeMenu} className="nav-link">
              {vaultLabel}
            </NavLink>
            <NavLink to="/learn" onClick={closeMenu} className="nav-link">LEARN/SOL</NavLink>
            <NavLink to="/about" onClick={closeMenu} className="nav-link">About JAL</NavLink>
          </nav>
        )}

        {/* socials left as-is */}
        <div className="social-links">
          <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer">
            <img src="/icons/X.png" alt="X" />
          </a>
          <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer">
            <img src="/icons/Telegram.png" alt="Telegram" />
          </a>
          <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer">
            <img src="/icons/TikTok.png" alt="TikTok" />
          </a>
        </div>

        {showNav && (
          <button className="hamburger" onClick={toggleMenu}>
            {menuOpen ? "✕" : "☰"}
          </button>
        )}
      </div>

      {showNav && menuOpen && (
        <>
          <div className="sidebar-overlay" onClick={closeMenu} />
          <div className="sidebar-nav">
            <NavLink to="/" onClick={closeMenu} className="nav-link">JAL/SOL</NavLink>
            <NavLink to={vaultPath} onClick={closeMenu} className="nav-link">{vaultLabel}</NavLink>
            <NavLink to="/learn" onClick={closeMenu} className="nav-link">LEARN/SOL</NavLink>
            <NavLink to="/about" onClick={closeMenu} className="nav-link">About JAL</NavLink>
          </div>
        </>
      )}
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crypto-generator" element={<CryptoGenerator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault/:symbol" element={<Vault />} />
          <Route path="/about" element={<About />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/content" element={<Content />} />
          <Route path="/learn" element={<Learn />} />
        </Routes>
        <div className="scroll-divider"></div>
      </main>
    </Router>
  );
}
